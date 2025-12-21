import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

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
}
