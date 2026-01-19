import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly authService: AuthService,
        private readonly mailerService: MailerService,
    ) { }

    async findAll(tenantId: string): Promise<Client[]> {
        return this.clientRepository.find({
            where: { tenantId, status: 'active' },
            order: { lastName: 'ASC', firstName: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string, relations: string[] = []): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { id, tenantId },
            relations,
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

    async createWithUser(dto: any, tenantId: string): Promise<Client> {
        // Check if email already exists
        const existingUser = await this.authService.findByEmail(dto.email, tenantId);
        if (existingUser) {
            throw new Error('Email is already registered');
        }

        // Create user account with transaction
        const user = await this.authService.createClientUser({
            email: dto.email,
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'client',
            gender: dto.gender,
        } as any, tenantId);

        // Create client profile linked to user
        const client = this.clientRepository.create({
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
            avatarUrl: dto.avatarUrl,
            status: dto.status || 'active',
            userId: user.id,
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

    async invite(id: string, tenantId: string): Promise<void> {
        const client = await this.findOne(id, tenantId);

        if (!client.email) {
            throw new Error('Client does not have an email address');
        }

        if (client.userId) {
            throw new Error('Client already has a user account linked');
        }

        let user = await this.authService.findByEmail(client.email, tenantId);

        if (user) {
            // User exists, verify role
            if (user.role !== 'client') {
                throw new Error(`Email is already registered as a ${user.role}. Cannot link to client profile.`);
            }
            // User exists as client, ready to link
        } else {
            // Create New Client User
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            user = await this.authService.createClientUser({
                email: client.email,
                password: tempPassword,
                firstName: client.firstName,
                lastName: client.lastName,
                role: 'client',
            } as any, tenantId);
        }

        if (!user) {
            throw new Error('Failed to retrieve or create user');
        }

        // Update Client with userId
        client.userId = user.id;
        await this.clientRepository.save(client);

        // Generate Invite Token
        const token = this.authService.generateInviteToken({
            id: user.id,
            email: user.email,
            tenantId
        });

        // Send Email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${frontendUrl}/auth/setup?token=${token}`;

        await this.mailerService.sendClientInvitation(client.email, inviteLink);
    }
}
