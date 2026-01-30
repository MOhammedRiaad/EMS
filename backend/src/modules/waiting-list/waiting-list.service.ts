import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitingListEntry, WaitingListStatus } from './entities/waiting-list.entity';
import { CreateWaitingListEntryDto, UpdateWaitingListEntryDto } from './dto';

import { AuditService } from '../audit/audit.service';
import { StudiosService } from '../studios/studios.service'; // Assuming this service exists
import { ClientsService } from '../clients/clients.service'; // Assuming this service exists

@Injectable()
export class WaitingListService {
    private readonly logger = new Logger(WaitingListService.name);

    constructor(
        @InjectRepository(WaitingListEntry)
        private readonly waitingListRepo: Repository<WaitingListEntry>,
        private readonly studiosService: StudiosService,
        private readonly clientsService: ClientsService,
        private readonly auditService: AuditService,
    ) { }

    async create(createDto: CreateWaitingListEntryDto, tenantId: string): Promise<WaitingListEntry> {
        // Default priority is based on timestamp (earlier = higher priority / lower number)
        const priority = Date.now();

        // Determine initial status
        const status = createDto.requiresApproval ? WaitingListStatus.PENDING : WaitingListStatus.APPROVED;

        const entry = this.waitingListRepo.create({
            ...createDto,
            tenantId,
            status,
            priority,
        });

        const savedEntry = await this.waitingListRepo.save(entry);

        await this.auditService.log(
            tenantId,
            'JOIN_WAITING_LIST',
            'WaitingListEntry',
            savedEntry.id,
            'CLIENT_API'
        );

        return savedEntry;
    }

    async findAll(tenantId: string, filters?: any): Promise<WaitingListEntry[]> {
        const query = this.waitingListRepo.createQueryBuilder('entry')
            .leftJoinAndSelect('entry.client', 'client')
            .leftJoinAndSelect('entry.studio', 'studio')
            .leftJoinAndSelect('entry.coach', 'coach')
            .leftJoinAndSelect('entry.session', 'session')
            .leftJoinAndSelect('entry.approver', 'approver')
            .where('entry.tenantId = :tenantId', { tenantId })
            .orderBy('entry.priority', 'ASC');

        if (filters?.status) {
            query.andWhere('entry.status = :status', { status: filters.status });
        }

        if (filters?.studioId) {
            query.andWhere('entry.studioId = :studioId', { studioId: filters.studioId });
        }

        return query.getMany();
    }

    async findOne(id: string, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.waitingListRepo.findOne({
            where: { id, tenantId },
            relations: ['client', 'studio', 'coach', 'session', 'approver']
        });

        if (!entry) {
            throw new NotFoundException(`Waiting list entry with ID ${id} not found`);
        }

        return entry;
    }

    async findByClient(clientId: string, tenantId: string): Promise<WaitingListEntry[]> {
        return this.waitingListRepo.find({
            where: { clientId, tenantId },
            relations: ['studio', 'coach', 'session'],
            order: { createdAt: 'DESC' }
        });
    }

    async update(id: string, updateDto: UpdateWaitingListEntryDto, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);
        Object.assign(entry, updateDto);
        return this.waitingListRepo.save(entry);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const result = await this.waitingListRepo.delete({ id, tenantId });
        if (result.affected === 0) {
            throw new NotFoundException(`Waiting list entry with ID ${id} not found`);
        }
        await this.auditService.log(
            tenantId,
            'LEAVE_WAITING_LIST',
            'WaitingListEntry',
            id,
            'CLIENT_API'
        );
    }

    async approve(id: string, approverId: string, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);

        entry.status = WaitingListStatus.APPROVED;
        entry.approvedBy = approverId;
        entry.approvedAt = new Date();

        return this.waitingListRepo.save(entry);
    }

    async reject(id: string, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);

        entry.status = WaitingListStatus.CANCELLED;
        // Optimization: Could also add rejectedBy/At logic if needed, reusing approver fields or adding new ones

        return this.waitingListRepo.save(entry);
    }

    async updatePriority(id: string, newPriority: number, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);
        entry.priority = newPriority;
        await this.waitingListRepo.save(entry);

        await this.auditService.log(
            tenantId,
            'UPDATE_WAITING_LIST',
            'WaitingListEntry',
            id,
            'CLIENT_API',
            { priority: newPriority }
        );
        return entry; // Return the updated entry
    }

    async notifyClient(id: string, tenantId: string, mailerService: any): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);

        if (!entry.client?.email) {
            throw new Error('Client email not found');
        }

        const subject = 'A Spot is Available - EMS Studio';
        const text = `Hi ${entry.client.firstName}, good news! A spot has opened up at ${entry.studio?.name || 'EMS Studio'}. Please contact us to book your session.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Great News! A Spot is Available</h2>
                <p>Hi ${entry.client.firstName},</p>
                <p>A training spot has opened up at <strong>${entry.studio?.name || 'EMS Studio'}</strong> that matches your preferences!</p>
                ${entry.preferredDate ? `<p><strong>Your preferred date:</strong> ${new Date(entry.preferredDate).toLocaleDateString()}</p>` : ''}
                ${entry.preferredTimeSlot ? `<p><strong>Time preference:</strong> ${entry.preferredTimeSlot}</p>` : ''}
                <p>Please contact us or log in to your client portal to book your session before the spot fills up.</p>
                <p style="color: #666; margin-top: 30px;">Best regards,<br>${entry.studio?.name || 'EMS Studio'}</p>
            </div>
        `;

        await mailerService.sendMail(entry.client.email, subject, text, html);

        entry.status = WaitingListStatus.NOTIFIED;
        entry.notifiedAt = new Date();
        return this.waitingListRepo.save(entry);
    }

    async markAsBooked(id: string, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);
        entry.status = WaitingListStatus.BOOKED;
        return this.waitingListRepo.save(entry);
    }
}
