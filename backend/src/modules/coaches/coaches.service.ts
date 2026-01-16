import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coach } from './entities/coach.entity';
import { CreateCoachDto, UpdateCoachDto } from './dto';

@Injectable()
export class CoachesService {
    constructor(
        @InjectRepository(Coach)
        private readonly coachRepository: Repository<Coach>,
    ) { }

    async findAll(tenantId: string): Promise<Coach[]> {
        return this.coachRepository.find({
            where: { tenantId, active: true },
            relations: ['user', 'studio'],
        });
    }

    async findByStudio(studioId: string, tenantId: string): Promise<Coach[]> {
        return this.coachRepository.find({
            where: { studioId, tenantId, active: true },
            relations: ['user', 'studio'],
        });
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
