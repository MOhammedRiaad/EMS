import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from '@otplib/preset-default';
import { toDataURL } from 'qrcode';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import {
  LoginDto,
  RegisterTenantOwnerDto,
  CreateUserDto,
  SetupPasswordDto,
} from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { TenantsService } from '../tenants/tenants.service';
import { MailerService } from '../mailer/mailer.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagService } from '../owner/services/feature-flag.service';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { SystemConfigService } from '../owner/services/system-config.service';
import { isPermissionAllowed } from '../../config/permissions.config';

@Injectable()
export class AuthService {
  // ... (constructor remains as previous valid state, skipping to resetPassword implementation)

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly tenantsService: TenantsService,
    private readonly mailerService: MailerService,
    private readonly auditService: AuditService,
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly systemConfigService: SystemConfigService,
  ) { }

  // Public registration - creates new Tenant + Tenant Owner
  async register(dto: RegisterTenantOwnerDto) {
    // Check if email is already used (globally for safety)
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    // Create the Tenant
    const tenant = await this.tenantsService.create({
      name: dto.businessName,
    });

    // Create the Tenant Owner user
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      tenantId: tenant.id,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'tenant_owner',
    });

    await this.userRepository.save(user);

    return this.generateTokens(user, tenant);
  }

  // Create user within a tenant (for admins/owners)
  async createUser(dto: CreateUserDto, currentUser: User) {
    // Only tenant_owner or admin can create users
    if (!['tenant_owner', 'admin'].includes(currentUser.role)) {
      throw new ForbiddenException(
        'Only tenant owners or admins can create users',
      );
    }

    return this.createClientUser(dto, currentUser.tenantId);
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, tenantId },
      relations: ['client'],
    });
  }

  // Internal method to create a user (client or otherwise) without permission checks
  // Used by ClientsService for invitation flow
  async createClientUser(dto: CreateUserDto, tenantId: string) {
    // Check if email already exists in this tenant
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email, tenantId },
    });

    if (existingUser) {
      throw new UnauthorizedException(
        'Email already registered in this tenant',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      tenantId,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
    });

    await this.userRepository.save(user);

    await this.userRepository.save(user);

    return user;
  }

  async findAllByTenant(
    tenantId: string,
    role?: string,
  ): Promise<Partial<User>[]> {
    const where: any = { tenantId };
    if (role) {
      where.role = role;
    }
    const users = await this.userRepository.find({
      where,
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    // Return safe user data without password
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
    }));
  }

  async login(dto: LoginDto) {
    let user: User | null = null;

    if (dto.tenantId) {
      user = await this.userRepository.findOne({
        where: { email: dto.email, tenantId: dto.tenantId },
        relations: ['client'],
      });
    } else {
      // Try to find user by email alone (for tenant owners or unique emails)
      const users = await this.userRepository.find({
        where: { email: dto.email },
        relations: ['client'],
      });

      if (users.length === 1) {
        user = users[0];
      } else if (users.length > 1) {
        // Ambiguous login without tenantId
        throw new UnauthorizedException(
          'Tenant ID required for ambiguous user',
        );
      }
    }

    // Maintenance Mode Check
    const maintenanceMode = await this.systemConfigService.get<boolean>(
      'system.maintenance_mode',
      false,
    );

    if (maintenanceMode && user) {
      // Only allow platform_owner during maintenance
      const roles = await this.permissionService.getUserRoles(user.id);
      const isOwner = roles.some((role) => role.key === 'platform_owner');

      if (!isOwner) {
        throw new ServiceUnavailableException({
          message:
            'System is currently under maintenance. Please try again later.',
          code: 'MAINTENANCE_MODE',
        });
      }
    }

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check Lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException(
        `Account locked until ${user.lockoutUntil.toISOString()}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await this.userRepository.save(user);
    }

    // Check 2FA
    if (user.isTwoFactorEnabled) {
      // Return early indicating 2FA is required. Client should prompt for code.
      // We don't generate full tokens yet.
      return {
        requiresTwoFactor: true,
        userId: user.id,
        tenantId: user.tenantId,
        // Temporary token to verify identity for 2FA step?
        // Simple design: Client calls /auth/2fa/authenticate with credentials + token?
        // Or we return a partial token.
        // For now, let's assume we return a flag and the client must call a separate endpoint `login-2fa` with userId + code.
      };
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Get tenant info
    const tenant = await this.tenantsService.findOne(user.tenantId);

    return this.generateTokens(user, tenant);
  }

  generateInviteToken(user: { id: string; email: string; tenantId: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      type: 'invite',
    };
    // Invite token valid for 7 days
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async validateUser(userId: string, tenantId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, tenantId, active: true },
      relations: ['client'],
    });
  }

  async setupPassword(dto: SetupPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.token);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    if (payload.type !== 'invite') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, tenantId: payload.tenantId },
      relations: ['client'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    user.passwordHash = passwordHash;
    user.emailVerified = true;
    user.active = true;

    await this.userRepository.save(user);

    // Get tenant info
    const tenant = await this.tenantsService.findOne(user.tenantId);

    return this.generateTokens(user, tenant);
  }

  // Two-Factor Authentication
  async generateTwoFactorSecret(user: User) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'EMS Studio', secret);
    const qrCode = await toDataURL(otpauthUrl);

    // Save secret temporarily (or permanently but disabled)
    user.twoFactorSecret = secret;
    await this.userRepository.save(user);

    return { secret, qrCode };
  }

  async enableTwoFactor(currentUser: User, token: string) {
    // Fetch user with secret (hidden by default)
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .where('user.id = :id', { id: currentUser.id })
      .getOne();

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA setup not initiated');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    user.isTwoFactorEnabled = true;
    await this.userRepository.save(user);

    return { message: '2FA enabled successfully' };
  }

  async disableTwoFactor(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null; // Optional: clear secret or keep it for easy re-enable? Security-wise clearing is better.
    await this.userRepository.save(user);

    return { message: '2FA disabled successfully' };
  }

  async verifyTwoFactorLogin(userId: string, token: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .leftJoinAndSelect('user.client', 'client')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Invalid user or 2FA not set up');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    // Get tenant info
    const tenant = await this.tenantsService.findOne(user.tenantId);
    return this.generateTokens(user, tenant);
  }

  // Password Reset
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Silently fail to prevent enumeration
      return { message: 'If email exists, reset instructions sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(resetToken, 10);

    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.userRepository.save(user);

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Fetch tenant settings for email config
    const tenant = await this.tenantsService.findOne(user.tenantId);
    const emailConfig = tenant.settings?.emailConfig;

    await this.mailerService.sendPasswordReset(email, resetLink, emailConfig);

    console.log(`Password reset token generated for ${email}`);

    // In production, don't return the token. For dev, maybe kept for convenience, but better to rely on email.
    return { message: 'If email exists, reset instructions sent.' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordResetToken',
        'passwordResetExpires',
        'passwordHash',
        'role',
        'firstName',
        'lastName',
        'tenantId',
        'failedLoginAttempts',
        'lockoutUntil',
      ],
    });

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Token expired');
    }

    const isValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!isValid) {
      throw new BadRequestException('Invalid token');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    // Also unlock account if locked
    user.lockoutUntil = null;
    user.failedLoginAttempts = 0;

    await this.userRepository.save(user);

    await this.auditService.log(
      user.tenantId,
      'RESET_PASSWORD',
      'User',
      user.id,
      user.id, // Self-service
    );

    return { message: 'Password has been reset successfully.' };
  }

  private async generateTokens(
    user: User,
    tenant?: { id: string; name: string; isComplete: boolean; settings?: any },
  ) {
    // Get user permissions
    let permissions = await this.permissionService.getUserPermissions(user.id);

    // SELF-HEALING: If no permissions found, check if user needs migration from legacy role
    if (permissions.length === 0 && user.role) {
      const legacyRoleKey = user.role;
      const role = await this.roleService.getRoleByKey(legacyRoleKey);

      if (role) {
        // Assign the role to the user
        await this.roleService.assignRoleToUser(user.id, role.id);
        // Refetch permissions
        permissions = await this.permissionService.getUserPermissions(user.id);
      }
    }

    // Get tenant features
    let enabledFeatures: string[] = [];
    if (user.tenantId) {
      const features = await this.featureFlagService.getFeaturesForTenant(
        user.tenantId,
      );
      enabledFeatures = features
        .filter((f: any) => f.enabled)
        .map((f: any) => f.feature.key);
    }

    // DYNAMIC PERMISSION FILTERING
    // Filter out permissions that are restricted by disabled features
    // This ensures Plan limits are enforced even if the Role has the permission.
    const filteredPermissions = permissions.filter((p) =>
      isPermissionAllowed(p.key, enabledFeatures),
    );
    const permissionKeys = filteredPermissions.map((p) => p.key);

    // Enforce Tenant Feature Access
    if (user.role === 'client' && !enabledFeatures.includes('client.portal')) {
      throw new ForbiddenException(
        'Client portal access is disabled for this tenant.',
      );
    }
    if (user.role === 'coach' && !enabledFeatures.includes('coach.portal')) {
      throw new ForbiddenException(
        'Coach portal access is disabled for this tenant.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      clientId: user.client?.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        clientId: user.client?.id,
        permissions: permissionKeys,
        features: enabledFeatures,
      },
      tenant: tenant
        ? {
          ...tenant,
          features: enabledFeatures,
        }
        : undefined,
    };
  }
  async update(id: string, updateData: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // Filter out sensitive fields just in case
    delete updateData.passwordHash;
    delete updateData.passwordResetToken;

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }
}
