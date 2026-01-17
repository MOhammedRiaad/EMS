import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions/sessions.service';
import { PackagesService } from '../packages/packages.service';
import { SessionStatus } from '../sessions/entities/session.entity';
import { ClientPackageStatus } from '../packages/entities/client-package.entity';

@Injectable()
export class ClientPortalService {
    constructor(
        private readonly sessionsService: SessionsService,
        private readonly packagesService: PackagesService,
    ) { }

    async getDashboard(clientId: string, tenantId: string) {
        // 1. Get next upcoming session
        // Note: findAll returns Promise<Session[]> directly, not paginated result
        const sessions = await this.sessionsService.findAll(tenantId, {
            clientId,
            status: 'scheduled',
            from: new Date().toISOString(), // Future sessions only
        });

        // Manually sort by startTime since filter might return unsorted or sort by default DB order
        const sortedSessions = sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const nextSession = sortedSessions[0] || null;

        // 2. Get active package (priority to the one with sessions remaining and not expired)
        const packages = await this.packagesService.getClientPackages(clientId, tenantId);

        // Filter for active packages
        const activePackages = packages.filter(p =>
            p.status === ClientPackageStatus.ACTIVE &&
            p.sessionsRemaining > 0 &&
            new Date(p.expiryDate) > new Date()
        );

        // Sort by expiry date (soonest first)
        activePackages.sort((a, b) => {
            const dateA = new Date(a.expiryDate).getTime();
            const dateB = new Date(b.expiryDate).getTime();
            return dateA - dateB;
        });

        const activePackage = activePackages[0] || null;

        return {
            nextSession,
            activePackage,
        };
    }

    async getMySessions(clientId: string, tenantId: string, from?: string, to?: string) {
        return this.sessionsService.findAll(tenantId, {
            clientId,
            from,
            to,
            // Sort by startTime ASC by default for schedule view
        });
    }

    async bookSession(clientId: string, tenantId: string, dto: any) {
        // Resolve studio
        let studioId = dto.studioId;
        if (!studioId) {
            studioId = await this.sessionsService.findFirstActiveStudio(tenantId);
        }
        if (!studioId) throw new Error('No active studio found');

        // Auto-assign Room & Coach
        const { roomId, coachId } = await this.sessionsService.autoAssignResources(
            tenantId,
            studioId,
            new Date(dto.startTime),
            new Date(dto.endTime)
        );

        // Construct full creation DTO (or partial object that SessionsService accepts)
        const sessionData = {
            ...dto,
            clientId,
            studioId,
            roomId,
            coachId,
            status: 'scheduled',
            // Default program/intensity if missing?
        };

        return this.sessionsService.create(sessionData, tenantId);
    }

    async cancelSession(clientId: string, tenantId: string, sessionId: string, reason?: string) {
        // Verify session belongs to client
        const session = await this.sessionsService.findOne(sessionId, tenantId);
        if (session.clientId !== clientId) {
            throw new Error('Unauthorized access to session');
        }

        // Apply cancellation policy (e.g. 24h/48h notice)
        // For now, we allow cancellation and let the service handle logic or we just pass it through.
        // If we want to automate "deduct session if late cancel", we need logic here.
        // Assuming strictly manual for now or "deduct=false" by default unless admin.
        // Actually, let's deduct if late cancel (less than 24h).

        const now = new Date();
        const sessionStart = new Date(session.startTime);
        const hoursDiff = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        const isLateCancel = hoursDiff < 24;
        const deductSession = isLateCancel; // Policy: Deduct if late

        return this.sessionsService.updateStatus(sessionId, tenantId, 'cancelled', deductSession);
    }

    async getAvailableSlots(tenantId: string, user: any, date: string) {
        const defaultId = await this.sessionsService.findFirstActiveStudio(tenantId);
        if (!defaultId) throw new Error('No active studio found');
        return this.sessionsService.getAvailableSlots(tenantId, defaultId, date);
    }
}
