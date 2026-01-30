import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionParticipant } from './entities/session-participant.entity';
import { Session } from './entities/session.entity';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class SessionParticipantsService {
    private readonly logger = new Logger(SessionParticipantsService.name);

    constructor(
        @InjectRepository(SessionParticipant)
        private participantRepo: Repository<SessionParticipant>,
        @InjectRepository(Session)
        private sessionRepo: Repository<Session>,
        private packagesService: PackagesService,
    ) { }

    async addParticipant(sessionId: string, clientId: string, tenantId: string) {
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId, tenantId },
            relations: ['participants']
        });
        if (!session) throw new NotFoundException('Session not found');

        if (session.type !== 'group') {
            throw new BadRequestException('Cannot add participants to individual session');
        }

        if (session.participants.length >= session.capacity) {
            throw new BadRequestException('Session capacity reached');
        }

        const existing = await this.participantRepo.findOne({
            where: { sessionId, clientId, tenantId }
        });
        if (existing) throw new BadRequestException('Client already joined this session');

        // Consume-on-book logic for group participant
        const bestPackage = await this.packagesService.findBestPackageForSession(clientId, tenantId);
        if (!bestPackage) throw new BadRequestException('Client has no active package with remaining sessions');

        await this.packagesService.useSession(bestPackage.id, tenantId);

        const participant = this.participantRepo.create({
            sessionId,
            clientId,
            tenantId,
            status: 'scheduled',
            clientPackageId: bestPackage.id
        });

        return this.participantRepo.save(participant);
    }

    async updateStatus(sessionId: string, clientId: string, status: 'scheduled' | 'in_progress' | 'completed' | 'no_show' | 'cancelled', tenantId: string) {
        const participant = await this.participantRepo.findOne({
            where: { sessionId, clientId, tenantId }
        });
        if (!participant) throw new NotFoundException('Participant not found');

        const oldStatus = participant.status;
        const isCancelled = status === 'cancelled';
        const wasCancelled = oldStatus === 'cancelled';

        if (isCancelled && !wasCancelled) {
            // Participant Cancelled -> Refund
            // Logic for late cancel check for group sessions?
            // Assuming same policy or just refund for now.
            if (participant.clientPackageId) {
                await this.packagesService.returnSession(participant.clientPackageId, tenantId);
            }
        } else if (!isCancelled && wasCancelled) {
            // Un-cancel
            if (participant.clientPackageId) {
                await this.packagesService.useSession(participant.clientPackageId, tenantId);
            }
        }
        // If 'completed' or 'no_show', we do nothing (already consumed)

        participant.status = status;
        return this.participantRepo.save(participant);
    }

    async removeParticipant(sessionId: string, clientId: string, tenantId: string) {
        const participant = await this.participantRepo.findOne({
            where: { sessionId, clientId, tenantId }
        });
        if (!participant) throw new NotFoundException('Participant not found');

        // If removing, it's effectively a cancellation/refund if it wasn't already refunded
        // If status was scheduled, we refund.
        // If status was cancelled, we already refunded.
        // If status was completed, we probably shouldn't remove? But if we do force remove, we refund?
        // Let's assume remove = full refund.

        if (participant.status !== 'cancelled' && participant.clientPackageId) {
            await this.packagesService.returnSession(participant.clientPackageId, tenantId);
        }

        return this.participantRepo.remove(participant);
    }

    async getParticipants(sessionId: string, tenantId: string) {
        return this.participantRepo.find({
            where: { sessionId, tenantId },
            relations: ['client']
        });
    }
}
