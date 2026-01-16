import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto, RegisterTenantOwnerDto, CreateUserDto } from './dto';
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

        // Check if email already exists in this tenant
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email, tenantId: currentUser.tenantId },
        });

        if (existingUser) {
            throw new UnauthorizedException('Email already registered in this tenant');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = this.userRepository.create({
            tenantId: currentUser.tenantId,
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
        });

        await this.userRepository.save(user);

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
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
            });
        } else {
            // Try to find user by email alone (for tenant owners or unique emails)
            const users = await this.userRepository.find({
                where: { email: dto.email },
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

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);

        // Get tenant info
        const tenant = await this.tenantsService.findOne(user.tenantId);

        return this.generateTokens(user, tenant);
    }

    async validateUser(userId: string, tenantId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id: userId, tenantId, active: true },
        });
    }

    private generateTokens(user: User, tenant?: { id: string; name: string; isComplete: boolean }) {
        const payload: JwtPayload = {
            sub: user.id,
            tenantId: user.tenantId,
            email: user.email,
            role: user.role,
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
            },
            tenant: tenant ? {
                id: tenant.id,
                name: tenant.name,
                isComplete: tenant.isComplete,
            } : undefined,
        };
    }
}

