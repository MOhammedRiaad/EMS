import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Coach } from './entities/coach.entity';
import { CreateCoachDto, UpdateCoachDto } from './dto';
import { AuthService } from '../auth/auth.service';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class CoachesService {
    constructor(
        @InjectRepository(Coach)
        private readonly coachRepository: Repository<Coach>,
        private readonly authService: AuthService,
        private readonly auditService: AuditService,
    ) { }

    async findAll(tenantId: string, search?: string): Promise<Coach[]> {
        const query = this.coachRepository.createQueryBuilder('coach')
            .leftJoinAndSelect('coach.user', 'user')
            .leftJoinAndSelect('coach.studio', 'studio')
            .where('coach.tenantId = :tenantId', { tenantId });

        if (search) {
            query.andWhere(new Brackets(qb => {
                qb.where('user.firstName ILIKE :search', { search: `%${search}%` })
                    .orWhere('user.lastName ILIKE :search', { search: `%${search}%` })
                    .orWhere('user.email ILIKE :search', { search: `%${search}%` })
                    .orWhere('coach.bio ILIKE :search', { search: `%${search}%` });
            }));
        }

        query.orderBy('coach.createdAt', 'DESC');
        return query.getMany();
    }

    async findByStudio(studioId: string, tenantId: string): Promise<Coach[]> {
        return this.coachRepository.find({
            where: { studioId, tenantId, active: true },
            relations: ['user', 'studio'],
        });
    }

    async findActive(tenantId: string, clientGender?: string, studioId?: string): Promise<Coach[]> {
        // Build where clause
        const whereClause: any = { tenantId, active: true };

        // Filter by studio if provided
        if (studioId) {
            whereClause.studioId = studioId;
        }

        // Basic active coaches query
        const coaches = await this.coachRepository.find({
            where: whereClause,
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
        const savedParams = await this.coachRepository.save(coach);

        await this.auditService.log(
            tenantId,
            'CREATE_COACH',
            'Coach',
            savedParams.id,
            coach.userId, // Assuming creator is linked user for now or handled upstream
            { studioId: dto.studioId }
        );

        return savedParams;
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

        const savedCoach = await this.coachRepository.save(coach);

        await this.auditService.log(
            tenantId,
            'CREATE_COACH',
            'Coach',
            savedCoach.id,
            coach.userId,
            { studioId: dto.studioId, email: dto.email }
        );

        return savedCoach;
    }

    async update(id: string, dto: UpdateCoachDto, tenantId: string): Promise<Coach> {
        const coach = await this.findOne(id, tenantId);

        const updatedCoach = { ...coach, ...dto };
        const { changes } = this.auditService.calculateDiff(coach, updatedCoach);

        Object.assign(coach, dto);
        const saved = await this.coachRepository.save(coach);

        if (Object.keys(changes).length > 0) {
            await this.auditService.log(
                tenantId,
                'UPDATE_COACH',
                'Coach',
                coach.id,
                'API_USER',
                { changes }
            );
        }

        return saved;
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const coach = await this.findOne(id, tenantId);
        // Soft delete by setting active = false
        coach.active = false;
        await this.coachRepository.save(coach);

        await this.auditService.log(
            tenantId,
            'DELETE_COACH',
            'Coach',
            id,
            'API_USER'
        );
    }
}
