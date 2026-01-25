import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParqResponse } from './entities/parq.entity';
import { CreateParqDto } from './dto/create-parq.dto';

@Injectable()
export class ParqService {
    constructor(
        @InjectRepository(ParqResponse)
        private readonly parqRepo: Repository<ParqResponse>,
    ) { }

    async create(tenantId: string, dto: CreateParqDto): Promise<ParqResponse> {
        // Compute risk if not provided (any true answer = risk)
        const hasRisk = dto.hasRisk ?? Object.values(dto.responses).some((val) => val === true);

        const parq = this.parqRepo.create({
            ...dto,
            tenantId,
            hasRisk,
            signedAt: new Date(),
        });
        return this.parqRepo.save(parq);
    }

    async getLatest(tenantId: string, clientId: string): Promise<ParqResponse | null> {
        return this.parqRepo.findOne({
            where: { tenantId, clientId },
            order: { signedAt: 'DESC' },
        });
    }

    async findAll(tenantId: string): Promise<ParqResponse[]> {
        return this.parqRepo.find({
            where: { tenantId },
            order: { signedAt: 'DESC' },
        });
    }
}
