import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage, ClientPackageStatus } from '../packages/entities/client-package.entity';

export interface DashboardNotification {
    id: string;
    type: 'session_today' | 'session_upcoming' | 'package_expiring' | 'package_low';
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
    ) { }

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
}
