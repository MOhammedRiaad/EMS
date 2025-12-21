import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coach } from './entities/coach.entity';

@Injectable()
export class CoachesService {
    constructor(
        @InjectRepository(Coach)
        private readonly coachRepository: Repository<Coach>,
    ) { }

    async findByStudio(studioId: string, tenantId: string): Promise<Coach[]> {
        return this.coachRepository.find({
            where: { studioId, tenantId, active: true },
            relations: ['user'],
        });
    }
}
