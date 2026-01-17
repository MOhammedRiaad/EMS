import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitingListEntry, WaitingListStatus } from './entities/waiting-list.entity';
import { CreateWaitingListEntryDto, UpdateWaitingListEntryDto } from './dto';

@Injectable()
export class WaitingListService {
    constructor(
        @InjectRepository(WaitingListEntry)
        private readonly waitingListRepository: Repository<WaitingListEntry>,
    ) { }

    async create(createDto: CreateWaitingListEntryDto, tenantId: string): Promise<WaitingListEntry> {
        // Default priority is based on timestamp (earlier = higher priority / lower number)
        const priority = Date.now();

        // Determine initial status
        const status = createDto.requiresApproval ? WaitingListStatus.PENDING : WaitingListStatus.APPROVED;

        const entry = this.waitingListRepository.create({
            ...createDto,
            tenantId,
            status,
            priority,
        });

        return this.waitingListRepository.save(entry);
    }

    async findAll(tenantId: string, filters?: any): Promise<WaitingListEntry[]> {
        const query = this.waitingListRepository.createQueryBuilder('entry')
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
        const entry = await this.waitingListRepository.findOne({
            where: { id, tenantId },
            relations: ['client', 'studio', 'coach', 'session', 'approver']
        });

        if (!entry) {
            throw new NotFoundException(`Waiting list entry with ID ${id} not found`);
        }

        return entry;
    }

    async findByClient(clientId: string, tenantId: string): Promise<WaitingListEntry[]> {
        return this.waitingListRepository.find({
            where: { clientId, tenantId },
            relations: ['studio', 'coach', 'session'],
            order: { createdAt: 'DESC' }
        });
    }

    async update(id: string, updateDto: UpdateWaitingListEntryDto, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);
        Object.assign(entry, updateDto);
        return this.waitingListRepository.save(entry);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const result = await this.waitingListRepository.delete({ id, tenantId });
        if (result.affected === 0) {
            throw new NotFoundException(`Waiting list entry with ID ${id} not found`);
        }
    }

    async approve(id: string, approverId: string, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);

        entry.status = WaitingListStatus.APPROVED;
        entry.approvedBy = approverId;
        entry.approvedAt = new Date();

        return this.waitingListRepository.save(entry);
    }

    async reject(id: string, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);

        entry.status = WaitingListStatus.CANCELLED;
        // Optimization: Could also add rejectedBy/At logic if needed, reusing approver fields or adding new ones

        return this.waitingListRepository.save(entry);
    }

    async updatePriority(id: string, newPriority: number, tenantId: string): Promise<WaitingListEntry> {
        const entry = await this.findOne(id, tenantId);
        entry.priority = newPriority;
        return this.waitingListRepository.save(entry);
    }
}
