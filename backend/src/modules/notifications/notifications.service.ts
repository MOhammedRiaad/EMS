import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, In, MoreThan } from 'typeorm';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage, ClientPackageStatus } from '../packages/entities/client-package.entity';
import { WaitingListEntry, WaitingListStatus } from '../waiting-list/entities/waiting-list.entity';
import { Notification } from './entities/notification.entity';
import { Announcement, AnnouncementTargetType } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';

export interface DashboardNotification {
    id: string;
    type: 'session_today' | 'session_upcoming' | 'package_expiring' | 'package_low' | 'waitlist_update';
    title: string;
    message: string;
    link?: string;
    priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        @InjectRepository(ClientPackage)
        private readonly clientPackageRepository: Repository<ClientPackage>,
        @InjectRepository(WaitingListEntry)
        private readonly waitingListRepository: Repository<WaitingListEntry>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(Announcement)
        private readonly announcementRepository: Repository<Announcement>,
        @InjectRepository(AnnouncementRead)
        private readonly announcementReadRepository: Repository<AnnouncementRead>,
    ) { }

    // --- In-App Notifications ---

    async createNotification(data: Partial<Notification>): Promise<Notification> {
        const notification = this.notificationRepository.create(data);
        return this.notificationRepository.save(notification);
    }

    async getUserNotifications(userId: string, tenantId: string): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { userId, tenantId },
            order: { createdAt: 'DESC' },
            take: 50
        });
    }

    async getUnreadCount(userId: string, tenantId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { userId, tenantId, readAt: null as any } // TypeORM null check
        });
    }

    async markAsRead(id: string, userId: string): Promise<void> {
        await this.notificationRepository.update({ id, userId }, { readAt: new Date() });
    }

    async markAllAsRead(userId: string, tenantId: string): Promise<void> {
        await this.notificationRepository.update(
            { userId, tenantId, readAt: null as any },
            { readAt: new Date() }
        );
    }

    // --- Announcements ---

    async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
        const announcement = this.announcementRepository.create(data);
        return this.announcementRepository.save(announcement);
    }

    async deleteAnnouncement(id: string, tenantId: string): Promise<void> {
        await this.announcementRepository.delete({ id, tenantId });
    }

    async getAllAnnouncements(tenantId: string): Promise<Announcement[]> {
        return this.announcementRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' }
        });
    }

    async getActiveAnnouncementsForUser(userId: string, tenantId: string, role: string): Promise<Announcement[]> {
        const now = new Date();

        // 1. Get all active announcements that are within date range
        const activeAnnouncements = await this.announcementRepository.find({
            where: [
                {
                    tenantId,
                    isActive: true,
                    endDate: MoreThan(now),
                    startDate: LessThan(now)
                },
                {
                    tenantId,
                    isActive: true,
                    endDate: null as any,
                    startDate: LessThan(now)
                }
            ]
        });

        // 2. Filter by target type logic
        const targetedRefs = activeAnnouncements.filter(a => {
            if (a.targetType === AnnouncementTargetType.ALL) return true;
            if (a.targetType === AnnouncementTargetType.CLIENTS && role === 'client') return true;
            if (a.targetType === AnnouncementTargetType.COACHES && role === 'coach') return true;
            if (a.targetType === AnnouncementTargetType.SPECIFIC_USERS) {
                return a.targetUserIds && a.targetUserIds.includes(userId);
            }
            return false;
        });

        // 3. Filter out ones already read by this user
        // Optimization: We could do a subquery or join, but for MVP this is fine unless thousands of announcements
        const reads = await this.announcementReadRepository.find({
            where: { userId }
        });
        const readIds = new Set(reads.map(r => r.announcementId));

        return targetedRefs.filter(a => !readIds.has(a.id));
    }

    async markAnnouncementRead(announcementId: string, userId: string): Promise<void> {
        // Idempotent check
        const existing = await this.announcementReadRepository.findOne({
            where: { announcementId, userId }
        });

        if (!existing) {
            await this.announcementReadRepository.save({
                announcementId,
                userId
            });
        }
    }

    // --- Dashboard logic below (unchanged) ---

    async getDashboardNotifications(tenantId: string): Promise<DashboardNotification[]> {
        const notifications: DashboardNotification[] = [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);

        // 1. Today's sessions
        const todaySessions = await this.sessionRepository.find({
            where: {
                tenantId,
                startTime: Between(today, tomorrow),
                status: 'scheduled'
            },
            relations: ['client', 'coach', 'coach.user'],
            order: { startTime: 'ASC' }
        });

        if (todaySessions.length > 0) {
            notifications.push({
                id: 'sessions-today',
                type: 'session_today',
                title: `${todaySessions.length} Session${todaySessions.length > 1 ? 's' : ''} Today`,
                message: todaySessions.slice(0, 3).map(s =>
                    `${s.client?.firstName || 'Unknown'} at ${new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                ).join(', ') + (todaySessions.length > 3 ? ` +${todaySessions.length - 3} more` : ''),
                link: '/sessions',
                priority: 'high'
            });
        }

        // 2. Expiring packages (within 7 days)
        const expiringPackages = await this.clientPackageRepository.find({
            where: {
                tenantId,
                status: ClientPackageStatus.ACTIVE,
                expiryDate: Between(today, in7Days)
            },
            relations: ['client', 'package']
        });

        if (expiringPackages.length > 0) {
            notifications.push({
                id: 'packages-expiring',
                type: 'package_expiring',
                title: `${expiringPackages.length} Package${expiringPackages.length > 1 ? 's' : ''} Expiring Soon`,
                message: expiringPackages.slice(0, 2).map(p =>
                    `${p.client?.firstName || 'Unknown'}: ${new Date(p.expiryDate).toLocaleDateString()}`
                ).join(', '),
                link: '/clients',
                priority: 'medium'
            });
        }

        // 3. Low session packages (2 or fewer remaining)
        const lowSessionPackages = await this.clientPackageRepository.find({
            where: {
                tenantId,
                status: ClientPackageStatus.ACTIVE,
                sessionsRemaining: LessThan(3)
            },
            relations: ['client', 'package']
        });

        // Filter out ones with 0 sessions (already depleted in status)
        const trulyLow = lowSessionPackages.filter(p => p.sessionsRemaining > 0);

        if (trulyLow.length > 0) {
            notifications.push({
                id: 'packages-low',
                type: 'package_low',
                title: `${trulyLow.length} Client${trulyLow.length > 1 ? 's' : ''} Low on Sessions`,
                message: trulyLow.slice(0, 2).map(p =>
                    `${p.client?.firstName || 'Unknown'}: ${p.sessionsRemaining} session${p.sessionsRemaining > 1 ? 's' : ''} left`
                ).join(', '),
                link: '/clients',
                priority: 'medium'
            });
        }

        // 4. Upcoming sessions tomorrow
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const tomorrowSessions = await this.sessionRepository.find({
            where: {
                tenantId,
                startTime: Between(tomorrow, dayAfterTomorrow),
                status: 'scheduled'
            }
        });

        if (tomorrowSessions.length > 0) {
            notifications.push({
                id: 'sessions-tomorrow',
                type: 'session_upcoming',
                title: `${tomorrowSessions.length} Session${tomorrowSessions.length > 1 ? 's' : ''} Tomorrow`,
                message: `Schedule is set for tomorrow`,
                link: '/sessions',
                priority: 'low'
            });
        }

        return notifications;
    }

    async getClientNotifications(tenantId: string, clientId: string): Promise<DashboardNotification[]> {
        const notifications: DashboardNotification[] = [];
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const in48Hours = new Date(now);
        in48Hours.setHours(in48Hours.getHours() + 48);

        // 1. Upcoming Sessions (Next 48 Hours)
        const upcomingSessions = await this.sessionRepository.find({
            where: {
                tenantId,
                clientId,
                startTime: Between(now, in48Hours),
                status: 'scheduled'
            },
            relations: ['coach', 'coach.user'],
            order: { startTime: 'ASC' }
        });

        if (upcomingSessions.length > 0) {
            notifications.push({
                id: 'client-upcoming-sessions',
                type: 'session_upcoming',
                title: 'Upcoming Session',
                message: `You have ${upcomingSessions.length} session${upcomingSessions.length > 1 ? 's' : ''} coming up. Next: ${new Date(upcomingSessions[0].startTime).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`,
                link: '/client/schedule',
                priority: 'high'
            });
        }

        // 2. Package Alerts (Expiring or Low Balance)
        const in7Days = new Date(now);
        in7Days.setDate(in7Days.getDate() + 7);

        const packages = await this.clientPackageRepository.find({
            where: {
                tenantId,
                clientId,
                status: ClientPackageStatus.ACTIVE
            },
            relations: ['package']
        });

        const expiring = packages.filter(p => new Date(p.expiryDate) <= in7Days);
        const lowBalance = packages.filter(p => p.sessionsRemaining <= 2 && p.sessionsRemaining > 0);

        if (expiring.length > 0) {
            notifications.push({
                id: 'client-package-expiring',
                type: 'package_expiring',
                title: 'Package Expiring Soon',
                message: `Your package "${expiring[0].package.name}" expires in ${Math.ceil((new Date(expiring[0].expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days.`,
                link: '/client/profile',
                priority: 'medium'
            });
        } else if (lowBalance.length > 0) {
            notifications.push({
                id: 'client-package-low',
                type: 'package_low',
                title: 'Low Session Balance',
                message: `You have only ${lowBalance[0].sessionsRemaining} session${lowBalance[0].sessionsRemaining === 1 ? '' : 's'} remaining in "${lowBalance[0].package.name}".`,
                link: '/client/profile',
                priority: 'medium'
            });
        }

        // 3. Waitlist Updates (Approved/Notified)
        const waitlistEntries = await this.waitingListRepository.find({
            where: {
                tenantId,
                clientId,
                status: In([WaitingListStatus.APPROVED, WaitingListStatus.NOTIFIED])
            },
            relations: ['studio']
        });

        if (waitlistEntries.length > 0) {
            notifications.push({
                id: 'client-waitlist-update',
                type: 'waitlist_update',
                title: 'Spot Available!',
                message: `A spot has opened up for your waitlist request! Please contact us or book now.`,
                link: '/client/booking', // Or wherever they should go
                priority: 'high'
            });
        }

        return notifications;
    }
}
