import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SessionsService } from '../sessions/sessions.service';
import { PackagesService } from '../packages/packages.service';
import { WaitingListService } from '../waiting-list/waiting-list.service';
import { ClientsService } from '../clients/clients.service';
import { SessionStatus } from '../sessions/entities/session.entity';
import { ClientPackageStatus } from '../packages/entities/client-package.entity';

import { CoachesService } from '../coaches/coaches.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteCoach } from '../gamification/entities/favorite-coach.entity';
import { ClientProgressPhoto } from '../clients/entities/client-progress-photo.entity';

@Injectable()
export class ClientPortalService {
    constructor(
        private readonly sessionsService: SessionsService,
        private readonly packagesService: PackagesService,
        private readonly waitingListService: WaitingListService,
        private readonly clientsService: ClientsService,
        private readonly coachesService: CoachesService,
        private readonly authService: AuthService,
        @InjectRepository(FavoriteCoach)
        private readonly favoriteCoachRepo: Repository<FavoriteCoach>,
        @InjectRepository(ClientProgressPhoto)
        private readonly progressPhotoRepo: Repository<ClientProgressPhoto>,
    ) { }

    // ... existing code ...



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

        // Count all scheduled sessions (including past ones that haven't been completed)
        const allScheduledSessions = await this.sessionsService.findAll(tenantId, {
            clientId,
            status: 'scheduled',
            from: new Date().toISOString(),
        });
        const scheduledCount = allScheduledSessions.length;

        // 2. Get active package to display
        // We prioritize the package that will be used for the next booking (oldest active)
        const activePackage = await this.packagesService.findBestPackageForSession(clientId, tenantId);

        // If no active package with sessions, maybe try to find ANY active package to show?
        // Or just return null. 
        // Let's try to find an active package even if 0 scheduled (already handled by findBestPackage? No, that requires > 0)
        // Fallback: Get most recent package if 'best' (consumable) is not found
        let displayPackage = activePackage;
        if (!displayPackage) {
            const packages = await this.packagesService.getClientPackages(clientId, tenantId);
            displayPackage = packages.find(p => p.status === ClientPackageStatus.ACTIVE) || packages[0] || null;
        }

        return {
            nextSession,
            activePackage: displayPackage ? {
                ...displayPackage,
                // Now simple: sessionsRemaining IS the available count.
                // We don't deduct scheduled sessions again because they are already deducted on book!
                availableSessions: displayPackage.sessionsRemaining,
                scheduledSessions: displayPackage.sessionsUsed, // usage history
            } : null,
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
        // Resolve studio - use client's linked studio
        const client = await this.clientsService.findOne(clientId, tenantId);
        if (!client) throw new Error('Client not found');

        let studioId = dto.studioId || client.studioId;
        if (!studioId) {
            // Fallback to first active studio only if client has no linked studio
            studioId = await this.sessionsService.findFirstActiveStudio(tenantId);
        }
        if (!studioId) throw new Error('No active studio found');

        // Auto-assign Room & Coach
        const { roomId, coachId } = await this.sessionsService.autoAssignResources(
            tenantId,
            studioId,
            new Date(dto.startTime),
            new Date(dto.endTime),
            dto.coachId
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

    async validateSession(clientId: string, tenantId: string, dto: any) {
        // Resolve studio - use client's linked studio
        const client = await this.clientsService.findOne(clientId, tenantId);
        if (!client) throw new Error('Client not found');

        let studioId = dto.studioId || client.studioId;
        if (!studioId) {
            studioId = await this.sessionsService.findFirstActiveStudio(tenantId);
        }
        if (!studioId) throw new Error('No active studio found');

        // Auto-assign Room & Coach (for the initial slot)
        // This assumes we try to book the SAME resources for the series.
        const { roomId, coachId } = await this.sessionsService.autoAssignResources(
            tenantId,
            studioId,
            new Date(dto.startTime),
            new Date(dto.endTime),
            dto.coachId
        );

        // Construct full creation DTO for validation
        const sessionData = {
            ...dto,
            clientId,
            studioId,
            roomId,
            coachId,
        };

        return this.sessionsService.validateRecurrence(sessionData, tenantId);
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

    async getAvailableSlots(clientId: string, tenantId: string, date: string, coachId?: string) {
        // Use client's linked studio for slot availability
        const client = await this.clientsService.findOne(clientId, tenantId);

        let studioId = client?.studioId;
        if (!studioId) {
            // Fallback to first active studio
            studioId = await this.sessionsService.findFirstActiveStudio(tenantId);
        }
        if (!studioId) throw new Error('No active studio found');

        return this.sessionsService.getAvailableSlots(tenantId, studioId, date, coachId);
    }

    async joinWaitingList(clientId: string, tenantId: string, dto: { studioId?: string; preferredDate: string; preferredTimeSlot: string; notes?: string }) {
        // Use client's linked studio by default
        const client = await this.clientsService.findOne(clientId, tenantId);

        let studioId: string | undefined = dto.studioId || client?.studioId || undefined;
        if (!studioId) {
            const firstStudio = await this.sessionsService.findFirstActiveStudio(tenantId);
            studioId = firstStudio || undefined;
        }

        if (!studioId) {
            throw new Error('Studio ID is required and no active studio found');
        }

        return this.waitingListService.create({
            clientId,
            studioId,
            preferredDate: dto.preferredDate,
            preferredTimeSlot: dto.preferredTimeSlot,
            notes: dto.notes,
            requiresApproval: true,
        }, tenantId);
    }

    async getProfile(clientId: string, tenantId: string) {
        const client = await this.clientsService.findOne(clientId, tenantId, ['user']);

        if (!client) {
            throw new Error('Client not found');
        }

        return {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            avatarUrl: client.avatarUrl,
            memberSince: client.createdAt,
            gender: client.user?.gender || (client as any).gender,
            privacyPreferences: client.privacyPreferences,
            consentFlags: client.consentFlags,
            // Extended fields
            healthGoals: client.healthGoals,
            medicalHistory: client.medicalHistory, // Check privacy requirements if this should be full or partial
            healthNotes: client.healthNotes,
            isTwoFactorEnabled: client.user?.isTwoFactorEnabled || false,
        };
    }

    async getCoaches(clientId: string, tenantId: string) {
        // Get client to filter coaches by studio and gender preference
        const client = await this.clientsService.findOne(clientId, tenantId, ['user']);
        if (!client) throw new Error('Client not found');

        const clientGender = client.user?.gender || (client as any).gender;
        const clientStudioId = client.studioId;

        // Filter by both studio and gender preference
        return this.coachesService.findActive(tenantId, clientGender, clientStudioId ?? undefined);
    }

    async updateProfile(clientId: string, tenantId: string, dto: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; gender?: string; privacyPreferences?: any; consentFlags?: any; healthGoals?: any[]; healthNotes?: string; medicalHistory?: any; }) {
        const client = await this.clientsService.findOne(clientId, tenantId, ['user']);

        if (!client) {
            throw new Error('Client not found');
        }

        // Update Client allowed fields
        const updateData: any = {};
        if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
        if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
        if (dto.phone !== undefined) updateData.phone = dto.phone;
        if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
        if ((dto as any).privacyPreferences !== undefined) updateData.privacyPreferences = (dto as any).privacyPreferences;
        if ((dto as any).consentFlags !== undefined) updateData.consentFlags = (dto as any).consentFlags;
        if (dto.healthGoals !== undefined) updateData.healthGoals = dto.healthGoals;
        if (dto.healthNotes !== undefined) updateData.healthNotes = dto.healthNotes;
        if (dto.medicalHistory !== undefined) updateData.medicalHistory = dto.medicalHistory;

        let clientUpdated = client;
        if (Object.keys(updateData).length > 0) {
            clientUpdated = await this.clientsService.update(clientId, updateData, tenantId);
        }

        // Update User (Gender)
        let updatedGender = client.user?.gender;
        if (dto.gender && client.userId) {
            await this.authService.update(client.userId, { gender: dto.gender as any });
            updatedGender = dto.gender as any;
        }

        return {
            id: clientUpdated.id,
            firstName: clientUpdated.firstName,
            lastName: clientUpdated.lastName,
            email: clientUpdated.email,
            phone: clientUpdated.phone,
            avatarUrl: clientUpdated.avatarUrl,
            gender: updatedGender,
            privacyPreferences: clientUpdated.privacyPreferences,
            consentFlags: clientUpdated.consentFlags,
            healthGoals: clientUpdated.healthGoals,
        };
    }

    async getMyWaitingList(clientId: string, tenantId: string) {
        const entries = await this.waitingListService.findByClient(clientId, tenantId);

        // Return formatted entries for client view
        return entries.map(entry => ({
            id: entry.id,
            preferredDate: entry.preferredDate,
            preferredTimeSlot: entry.preferredTimeSlot,
            status: entry.status,
            studio: entry.studio ? { id: entry.studio.id, name: entry.studio.name } : null,
            createdAt: entry.createdAt,
            notifiedAt: entry.notifiedAt,
        }));
    }

    async cancelWaitingListEntry(clientId: string, tenantId: string, entryId: string) {
        // First verify the entry belongs to this client
        const entry = await this.waitingListService.findOne(entryId, tenantId);

        if (entry.clientId !== clientId) {
            throw new Error('You can only cancel your own waiting list entries');
        }

        // Use the remove method to delete the entry
        await this.waitingListService.remove(entryId, tenantId);
        return { message: 'Waiting list entry cancelled successfully' };
    }

    async toggleFavoriteCoach(clientId: string, tenantId: string, coachId: string) {
        // Check if coach exists and is active
        const coach = await this.coachesService.findOne(coachId, tenantId);
        if (!coach) throw new Error('Coach not found');

        const existing = await this.favoriteCoachRepo.findOne({
            where: { clientId, tenantId, coachId }
        });

        if (existing) {
            await this.favoriteCoachRepo.remove(existing);
            return { favorited: false };
        } else {
            const favorite = this.favoriteCoachRepo.create({
                clientId,
                tenantId,
                coachId,
            });
            await this.favoriteCoachRepo.save(favorite);
            return { favorited: true };
        }
    }

    async getFavoriteCoaches(clientId: string, tenantId: string) {
        const favorites = await this.favoriteCoachRepo.find({
            where: { clientId, tenantId },
            relations: ['coach', 'coach.user'],
            order: { favoritedAt: 'DESC' }
        });

        return favorites.map(f => ({
            ...f.coach,
            favoritedAt: f.favoritedAt
        }));
    }

    // Progress Photos
    async getProgressPhotos(clientId: string, tenantId: string) {
        return this.progressPhotoRepo.find({
            where: { clientId, tenantId },
            order: { takenAt: 'DESC' }
        });
    }

    async addProgressPhoto(clientId: string, tenantId: string, dto: { photoUrl: string; notes?: string; type?: 'front' | 'back' | 'side' | 'other'; takenAt?: Date }) {
        const photo = this.progressPhotoRepo.create({
            clientId,
            tenantId,
            ...dto
        });
        return this.progressPhotoRepo.save(photo);
    }

    async deleteProgressPhoto(clientId: string, tenantId: string, photoId: string) {
        const photo = await this.progressPhotoRepo.findOne({ where: { id: photoId, tenantId } });
        if (!photo) throw new Error('Photo not found');

        if (photo.clientId !== clientId) {
            throw new Error('Unauthorized');
        }

        await this.progressPhotoRepo.remove(photo);
        return { message: 'Photo deleted' };
    }
}
