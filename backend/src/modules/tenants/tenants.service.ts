import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto';

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

    async findBySlug(slug: string): Promise<Tenant | null> {
        return this.tenantRepository.findOne({ where: { slug } });
    }

    async checkSlugAvailable(slug: string): Promise<boolean> {
        const existing = await this.tenantRepository.findOne({ where: { slug } });
        return !existing;
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    async create(dto: CreateTenantDto): Promise<Tenant> {
        const slug = dto.slug || this.generateSlug(dto.name);

        const existing = await this.tenantRepository.findOne({ where: { slug } });
        if (existing) {
            throw new ConflictException(`Tenant with slug "${slug}" already exists`);
        }

        const tenant = this.tenantRepository.create({
            name: dto.name,
            slug,
            isComplete: false,
        });

        return this.tenantRepository.save(tenant);
    }

    async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
        const tenant = await this.findOne(id);

        Object.assign(tenant, dto);

        // Merge branding into settings if provided
        if (dto.branding) {
            tenant.settings = {
                ...(tenant.settings || {}),
                branding: {
                    ...(tenant.settings?.branding || {}),
                    ...dto.branding
                }
            };
        }

        // Check if all required fields are now filled to set isComplete
        if (tenant.address && tenant.phone && tenant.city && tenant.state && tenant.zipCode) {
            tenant.isComplete = true;
        }

        return this.tenantRepository.save(tenant);
    }
}
