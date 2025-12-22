import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto, RegisterDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email, tenantId: dto.tenantId },
        });

        if (existingUser) {
            throw new UnauthorizedException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = this.userRepository.create({
            tenantId: dto.tenantId,
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role || 'client',
        });

        await this.userRepository.save(user);

        return this.generateTokens(user);
    }

    async login(dto: LoginDto) {
        let user: User | null = null;

        if (dto.tenantId) {
            user = await this.userRepository.findOne({
                where: { email: dto.email, tenantId: dto.tenantId },
            });
        } else {
            // Try to find user by email alone (for Super Admin or if unique)
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

        return this.generateTokens(user);
    }

    async validateUser(userId: string, tenantId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id: userId, tenantId, active: true },
        });
    }

    private generateTokens(user: User) {
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
            },
        };
    }
}
