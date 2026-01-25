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

        // Check package availability
        const activePackage = await this.packagesService.getActivePackageForClient(clientId, tenantId);
        if (!activePackage) throw new BadRequestException('Client has no active package');

        // Count scheduled sessions for this client (both individual and group participants)
        // We need to count where they are a participant in 'scheduled' session? 
        // Or participant status is 'scheduled'?
        // The participant entity has status. Session entity has status.
        // If session is 'scheduled', participant is 'scheduled' by default.
        // Logic: activePackage.sessionsRemaining - (scheduledSessionsCount);

        // For now, let's just ensure they have credits.
        if (activePackage.sessionsRemaining <= 0) throw new BadRequestException('No sessions remaining in package');

        const participant = this.participantRepo.create({
            sessionId,
            clientId,
            tenantId,
            status: 'scheduled'
        });

        return this.participantRepo.save(participant);
    }

    async updateStatus(sessionId: string, clientId: string, status: 'completed' | 'no_show' | 'cancelled', tenantId: string) {
        const participant = await this.participantRepo.findOne({
            where: { sessionId, clientId, tenantId }
        });
        if (!participant) throw new NotFoundException('Participant not found');

        const oldStatus = participant.status;

        // If status changing to consumed (completed/no_show) from non-consumed (scheduled/cancelled)
        const isConsuming = ['completed', 'no_show'].includes(status);
        const wasConsuming = ['completed', 'no_show'].includes(oldStatus);

        if (isConsuming && !wasConsuming) {
            // Deduct session
            // We need the client package ID. We assume active package?
            // Or better, `PackagesService` should handle "deduct one session for client".
            const activePackage = await this.packagesService.getActivePackageForClient(clientId, tenantId);
            if (!activePackage) throw new BadRequestException('Client has no active package to deduct from');

            await this.packagesService.useSession(activePackage.id, tenantId);
        } else if (!isConsuming && wasConsuming) {
            // Refund session (e.g. marked attended then changed to cancelled)
            // We assume we return to the active package or last used?
            // `returnSession` logic assumes we know the package ID.
            // Ideally we store `packageId` on the `SessionParticipant` to link usage?
            // For now, return to active.
            const activePackage = await this.packagesService.getActivePackageForClient(clientId, tenantId);
            if (activePackage) {
                await this.packagesService.returnSession(activePackage.id, tenantId);
            }
        }

        participant.status = status;
        return this.participantRepo.save(participant);
    }

    async removeParticipant(sessionId: string, clientId: string, tenantId: string) {
        const participant = await this.participantRepo.findOne({
            where: { sessionId, clientId, tenantId }
        });
        if (!participant) throw new NotFoundException('Participant not found');

        // If was consumed, we might need to refund? 
        // "remove" usually means cancelled. call updateStatus to 'cancelled' first?
        if (['completed', 'no_show'].includes(participant.status)) {
            const activePackage = await this.packagesService.getActivePackageForClient(clientId, tenantId);
            if (activePackage) await this.packagesService.returnSession(activePackage.id, tenantId);
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
