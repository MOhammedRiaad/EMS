import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketMessage, TicketStatus } from './entities/index';
import { CreateTicketDto, CreateMessageDto, UpdateTicketStatusDto } from './dto/index';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(SupportTicket)
        private ticketRepository: Repository<SupportTicket>,
        @InjectRepository(TicketMessage)
        private messageRepository: Repository<TicketMessage>,
    ) { }

    async createTicket(user: User, dto: CreateTicketDto): Promise<SupportTicket> {
        const ticket = this.ticketRepository.create({
            subject: dto.subject,
            message: dto.message,
            priority: dto.priority,
            category: dto.category,
            userId: user.id,
            tenantId: user.tenantId,
            status: TicketStatus.OPEN
        });
        return this.ticketRepository.save(ticket);
    }

    async findAll(user: User): Promise<SupportTicket[]> {
        // Owners (Super Admin) see all, Tenants see their own
        // Note: Assuming 'admin' role in 'owner' tenant is the Super Admin
        // For now, simpler check: if user has a specific permission or role.
        // Let's assume 'owner' role users can see all if they are in the 'owner' tenant.

        // However, standard tenants only see their own.
        // We can use a flag or helper. 
        // For this "Minimal" version:
        // If user is a tenant_owner or coach or client -> filter by tenantId.
        // If user is the Platform Owner -> show all.

        // Currently we don't have a rigid "Platform Owner" flag on User. 
        // We'll trust the caller content or check role.

        const query = this.ticketRepository.createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.user', 'user')
            .leftJoinAndSelect('ticket.tenant', 'tenant')
            .orderBy('ticket.createdAt', 'DESC');

        // Logic pivot: If the user is an 'admin' or 'owner' of the Platform Tenant, they see all.
        // But simpler: Filter by tenantId for everyone except specific logic?
        // Let's implement a 'filterByTenant' param or just enforce tenant isolation always, 
        // and have a separate method `findAllForOwner` for the owner portal.

        // Actually, let's enforce tenant isolation here by default.
        // If the user's role is 'owner' (the super admin role name?), they might bypass.
        // But 'owner' role is for the Owner Portal user.

        if (user.role !== 'owner') {
            query.where('ticket.tenantId = :tenantId', { tenantId: user.tenantId });
        }

        return query.getMany();
    }

    async findOne(id: string, user: User): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findOne({
            where: { id },
            relations: ['messages', 'messages.user', 'user', 'tenant']
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        // Access check
        if (user.role !== 'owner' && ticket.tenantId !== user.tenantId) {
            throw new ForbiddenException('Access denied');
        }

        return ticket;
    }

    async createMessage(ticketId: string, user: User, dto: CreateMessageDto): Promise<TicketMessage> {
        const ticket = await this.findOne(ticketId, user); // checks access

        const message = this.messageRepository.create({
            ticketId: ticket.id,
            userId: user.id,
            message: dto.message
        });

        // Auto-update status if user replies?
        // If owner replies, maybe set to 'in_progress'?

        return this.messageRepository.save(message);
    }

    async updateStatus(id: string, user: User, dto: UpdateTicketStatusDto): Promise<SupportTicket> {
        const ticket = await this.findOne(id, user);

        // Access Control: Only owner can change to any status. 
        // Tenants can ONLY 'reopen' (set to open) their own closed tickets.
        if (user.role !== 'owner') {
            if (dto.status !== TicketStatus.OPEN) {
                throw new ForbiddenException('Tenants can only reopen tickets');
            }
            if (ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.RESOLVED) {
                throw new ForbiddenException('Ticket is not closed or resolved');
            }
        }

        ticket.status = dto.status;
        return this.ticketRepository.save(ticket);
    }
}
