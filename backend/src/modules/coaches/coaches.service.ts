import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coach } from './entities/coach.entity';
import { CreateCoachDto, UpdateCoachDto } from './dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CoachesService {
    constructor(
        @InjectRepository(Coach)
        private readonly coachRepository: Repository<Coach>,
        private readonly authService: AuthService,
    ) { }

    async findAll(tenantId: string): Promise<Coach[]> {
        const coaches = await this.coachRepository.find({
            where: { tenantId },
            relations: ['user', 'studio'],
            order: { createdAt: 'DESC' }
        });
        return coaches;
    }

    async findByStudio(studioId: string, tenantId: string): Promise<Coach[]> {
        return this.coachRepository.find({
            where: { studioId, tenantId, active: true },
            relations: ['user', 'studio'],
        });
    }

    async findActive(tenantId: string, clientGender?: string): Promise<Coach[]> {
        // Basic active coaches query
        const coaches = await this.coachRepository.find({
            where: { tenantId, active: true },
            relations: ['user', 'studio'],
            order: { createdAt: 'DESC' }
        });

        // If client gender is provided, filter by preference
        if (clientGender) {
            return coaches.filter(coach =>
                coach.preferredClientGender === 'any' ||
                coach.preferredClientGender === clientGender
            );
        }

        return coaches;
    }

    async findOne(id: string, tenantId: string): Promise<Coach> {
        const coach = await this.coachRepository.findOne({
            where: { id, tenantId },
            relations: ['user', 'studio'],
        });
        if (!coach) {
            throw new NotFoundException(`Coach with ID ${id} not found`);
        }
        return coach;
    }

    async create(dto: CreateCoachDto, tenantId: string): Promise<Coach> {
        const coach = this.coachRepository.create({
            ...dto,
            tenantId,
        });
        return this.coachRepository.save(coach);
    }

    async createWithUser(dto: any, tenantId: string): Promise<Coach> {
        // Check if email already exists
        const existingUser = await this.authService.findByEmail(dto.email, tenantId);
        if (existingUser) {
            throw new Error('Email is already registered');
        }

        // Create user account
        const user = await this.authService.createClientUser({
            email: dto.email,
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'coach',
            gender: dto.gender,
        } as any, tenantId);

        // Create coach profile
        const coach = this.coachRepository.create({
            userId: user.id,
            studioId: dto.studioId,
            bio: dto.bio,
            specializations: dto.specializations || [],
            preferredClientGender: dto.preferredClientGender || 'any',
            tenantId,
        });

        return this.coachRepository.save(coach);
    }

    async update(id: string, dto: UpdateCoachDto, tenantId: string): Promise<Coach> {
        const coach = await this.findOne(id, tenantId);
        Object.assign(coach, dto);
        return this.coachRepository.save(coach);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const coach = await this.findOne(id, tenantId);
        // Soft delete by setting active = false
        coach.active = false;
        await this.coachRepository.save(coach);
    }
}
