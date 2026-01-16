import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Session } from '../sessions/entities/session.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Client)
        private readonly clientsRepo: Repository<Client>,
        @InjectRepository(Coach)
        private readonly coachesRepo: Repository<Coach>,
        @InjectRepository(Session)
        private readonly sessionsRepo: Repository<Session>,
    ) { }

    async getStats(tenantId: string) {
        // Active Clients
        const activeClients = await this.clientsRepo.count({
            where: { tenantId, status: 'active' }
        });

        // Active Coaches
        const activeCoaches = await this.coachesRepo.count({
            where: { tenantId, active: true }
        });

        // Today's Sessions
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todaySessions = await this.sessionsRepo.count({
            where: {
                tenantId,
                startTime: Between(todayStart, todayEnd)
            }
        });

        // Revenue (Estimated based on completed sessions this month * 45 EUR)
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

        const completedSessionsThisMonth = await this.sessionsRepo.count({
            where: {
                tenantId,
                status: 'completed',
                startTime: MoreThanOrEqual(firstDay)
            }
        });

        return {
            activeClients,
            activeCoaches,
            todaySessions,
            revenue: completedSessionsThisMonth * 45
        };
    }
}
