import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from './entities/studio.entity';
import { CreateStudioDto, UpdateStudioDto } from './dto';

@Injectable()
export class StudiosService {
    constructor(
        @InjectRepository(Studio)
        private readonly studioRepository: Repository<Studio>,
    ) { }

    async findAll(tenantId: string): Promise<Studio[]> {
        return this.studioRepository.find({
            where: { tenantId },
            relations: ['rooms'],
        });
    }

    async findOne(id: string, tenantId: string): Promise<Studio> {
        const studio = await this.studioRepository.findOne({
            where: { id, tenantId },
            relations: ['rooms'],
        });
        if (!studio) {
            throw new NotFoundException(`Studio ${id} not found`);
        }
        return studio;
    }

    async create(dto: CreateStudioDto, tenantId: string): Promise<Studio> {
        // Generate slug from name
        const slug = dto.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const studio = this.studioRepository.create({
            ...dto,
            tenantId,
            slug,
        });
        return this.studioRepository.save(studio);
    }

    async update(id: string, dto: UpdateStudioDto, tenantId: string): Promise<Studio> {
        const studio = await this.findOne(id, tenantId);
        Object.assign(studio, dto);
        return this.studioRepository.save(studio);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const studio = await this.findOne(id, tenantId);
        // Soft delete by setting active = false
        studio.active = false;
        await this.studioRepository.save(studio);
    }
}
