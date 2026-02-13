import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PlatformRevenue, RevenueStatus } from '../entities/platform-revenue.entity';
import { CreatePlatformRevenueDto, PlatformRevenueFiltersDto } from '../dto/platform-revenue.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class PlatformRevenueService {
    constructor(
        @InjectRepository(PlatformRevenue)
        private readonly revenueRepository: Repository<PlatformRevenue>,
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
    ) { }

    async create(dto: CreatePlatformRevenueDto): Promise<PlatformRevenue> {
        const tenant = await this.tenantRepository.findOne({ where: { id: dto.tenantId } });
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${dto.tenantId} not found`);
        }

        const revenue = this.revenueRepository.create({
            ...dto,
            tenant,
        });

        return this.revenueRepository.save(revenue);
    }

    async findAll(filters: PlatformRevenueFiltersDto): Promise<PlatformRevenue[]> {
        const where: any = {};

        if (filters.tenantId) {
            where.tenantId = filters.tenantId;
        }

        if (filters.type) {
            where.type = filters.type;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.startDate && filters.endDate) {
            where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
        }

        return this.revenueRepository.find({
            where,
            relations: ['tenant'],
            order: { createdAt: 'DESC' },
        });
    }

    async getStats(startDate: Date, endDate: Date) {
        const records = await this.revenueRepository.find({
            where: {
                status: RevenueStatus.COMPLETED,
                createdAt: Between(startDate, endDate),
            }
        });

        const totalRevenue = records.reduce((sum, record) => sum + Number(record.amount), 0);
        const count = records.length;

        return {
            totalRevenue,
            count,
            period: {
                start: startDate,
                end: endDate
            }
        };
    }
}
