import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from '@otplib/preset-default';
import { toDataURL } from 'qrcode';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { LoginDto, RegisterTenantOwnerDto, CreateUserDto, SetupPasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly tenantsService: TenantsService,
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
            throw new ForbiddenException('Only tenant owners or admins can create users');
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
            throw new UnauthorizedException('Email already registered in this tenant');
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

    async findAllByTenant(tenantId: string, role?: string): Promise<Partial<User>[]> {
        const where: any = { tenantId };
        if (role) {
            where.role = role;
        }
        const users = await this.userRepository.find({
            where,
            order: { lastName: 'ASC', firstName: 'ASC' },
        });
        // Return safe user data without password
        return users.map(u => ({
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
                throw new UnauthorizedException('Tenant ID required for ambiguous user');
            }
        }

        if (!user || !user.active) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check Lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            throw new UnauthorizedException(`Account locked until ${user.lockoutUntil.toISOString()}`);
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
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

    generateInviteToken(user: { id: string, email: string, tenantId: string }) {
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

    async enableTwoFactor(user: User, token: string) {
        if (!user.twoFactorSecret) {
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

    async verifyTwoFactorLogin(userId: string, token: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
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

        // TODO: Send email
        console.log(`Password reset token method: URL/reset-password?token=${resetToken}&email=${email}`);

        return { message: 'If email exists, reset instructions sent.', debugToken: resetToken };
    }

    async resetPassword(email: string, token: string, newPassword: string) {
        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'passwordResetToken', 'passwordResetExpires', 'passwordHash', 'role', 'firstName', 'lastName', 'tenantId', 'failedLoginAttempts', 'lockoutUntil']
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

        return { message: 'Password reset successfully' };
    }

    private generateTokens(user: User, tenant?: { id: string; name: string; isComplete: boolean }) {
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
            },
            tenant: tenant ? {
                id: tenant.id,
                name: tenant.name,
                isComplete: tenant.isComplete,
            } : undefined,
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
