import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
    ) { }

    async findAll(): Promise<Tenant[]> {
        return this.tenantRepository.find();
    }

    async findOne(id: string): Promise<Tenant> {
        const tenant = await this.tenantRepository.findOne({ where: { id } });
        if (!tenant) {
            throw new NotFoundException(`Tenant ${id} not found`);
        }
        return tenant;
    }

    async findBySlug(slug: string): Promise<Tenant> {
        const tenant = await this.tenantRepository.findOne({ where: { slug } });
        if (!tenant) {
            throw new NotFoundException(`Tenant with slug ${slug} not found`);
        }
        return tenant;
    }
}
