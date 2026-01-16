import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ) { }

    async findAll(tenantId: string): Promise<Client[]> {
        return this.clientRepository.find({
            where: { tenantId, status: 'active' },
            order: { lastName: 'ASC', firstName: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { id, tenantId },
        });
        if (!client) {
            throw new NotFoundException(`Client ${id} not found`);
        }
        return client;
    }

    async create(dto: CreateClientDto, tenantId: string): Promise<Client> {
        const client = this.clientRepository.create({
            ...dto,
            tenantId,
        });
        return this.clientRepository.save(client);
    }

    async update(id: string, dto: UpdateClientDto, tenantId: string): Promise<Client> {
        const client = await this.findOne(id, tenantId);
        Object.assign(client, dto);
        return this.clientRepository.save(client);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const client = await this.findOne(id, tenantId);
        // Soft delete by setting status to inactive
        client.status = 'inactive';
        await this.clientRepository.save(client);
    }
}
