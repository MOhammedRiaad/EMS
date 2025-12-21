import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Studio } from './entities/studio.entity';

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
}
