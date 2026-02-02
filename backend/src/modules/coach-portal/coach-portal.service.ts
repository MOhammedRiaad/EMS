import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Session, SessionStatus } from '../sessions/entities/session.entity';
import { Client } from '../clients/entities/client.entity';
import { InBodyScan } from '../inbody-scans/entities/inbody-scan.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { CoachTimeOffRequest } from '../coaches/entities/coach-time-off.entity';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class CoachPortalService {
    constructor(
        @InjectRepository(Session)
        private sessionsRepository: Repository<Session>,
        @InjectRepository(Client)
        private clientsRepository: Repository<Client>,
        @InjectRepository(InBodyScan)
        private inBodyScansRepository: Repository<InBodyScan>,
        @InjectRepository(Coach)
        private coachesRepository: Repository<Coach>,
        @InjectRepository(CoachTimeOffRequest)
        private timeOffRepository: Repository<CoachTimeOffRequest>,
    ) { }

    private async getCoachId(userId: string): Promise<string> {
        const coach = await this.coachesRepository.findOne({ where: { userId } });
        if (!coach) throw new UnauthorizedException('User is not a registered coach');
        return coach.id;
    }

    async getDashboardStats(userId: string, tenantId: string) {
        const coachId = await this.getCoachId(userId);
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        const todaysSessions = await this.sessionsRepository.find({
            where: {
                coachId,
                tenantId,
                startTime: Between(start, end),
                status: 'scheduled' as SessionStatus
            },
            relations: ['client']
        });

        return {
            sessionsCount: todaysSessions.length,
            nextSession: todaysSessions.find(s => new Date(s.startTime) > new Date()),
        };
    }

    async getSchedule(userId: string, tenantId: string, date: Date, range: 'day' | 'week' | 'month' | 'future') {
        const coachId = await this.getCoachId(userId);
        let whereCondition: any = {
            coachId,
            tenantId,
        };

        if (range === 'future') {
            whereCondition.startTime = Between(new Date(), new Date('2100-01-01')); // broad future range
        } else {
            let start: Date;
            let end: Date;

            if (range === 'week') {
                start = startOfWeek(date, { weekStartsOn: 1 });
                end = endOfWeek(date, { weekStartsOn: 1 });
            } else if (range === 'month') {
                start = startOfMonth(date);
                end = endOfMonth(date);
            } else {
                start = startOfDay(date);
                end = endOfDay(date);
            }
            whereCondition.startTime = Between(start, end);
        }

        return this.sessionsRepository.find({
            where: whereCondition,
            relations: ['client', 'room', 'studio', 'participants', 'participants.client'],
            order: { startTime: 'ASC' }
        });
    }

    async updateSessionStatus(sessionId: string, userId: string, tenantId: string, status: SessionStatus) {
        const coachId = await this.getCoachId(userId);
        const session = await this.sessionsRepository.findOne({
            where: { id: sessionId, coachId, tenantId },
        });

        if (!session) {
            throw new NotFoundException('Session not found or not assigned to you');
        }

        session.status = status;
        return this.sessionsRepository.save(session);
    }

    async getMyClients(userId: string, tenantId: string) {
        const coachId = await this.getCoachId(userId);
        return this.clientsRepository.createQueryBuilder('client')
            .innerJoin('client.sessions', 'session')
            .where('session.coachId = :coachId', { coachId })
            .andWhere('client.tenantId = :tenantId', { tenantId })
            .select(['client.id', 'client.firstName', 'client.lastName', 'client.email', 'client.phone', 'client.avatarUrl'])
            .distinct(true)
            .orderBy('client.firstName', 'ASC')
            .getMany();
    }

    async checkClientAccess(userId: string, clientId: string): Promise<boolean> {
        const coachId = await this.getCoachId(userId);
        const count = await this.sessionsRepository.count({
            where: {
                coachId,
                clientId
            }
        });
        return count > 0;
    }

    async getClientDetails(clientId: string, tenantId: string) {
        const client = await this.clientsRepository.findOne({
            where: { id: clientId, tenantId }
        });

        if (!client) throw new NotFoundException('Client not found');

        const recentMeasurements = await this.inBodyScansRepository.find({
            where: { clientId },
            order: { scanDate: 'DESC' },
            take: 5
        });

        const recentWorkouts = await this.sessionsRepository.find({
            where: { clientId, status: 'completed' as SessionStatus },
            order: { startTime: 'DESC' },
            take: 5,
            select: ['id', 'startTime', 'notes', 'coachId']
        });

        return {
            profile: client,
            measurements: recentMeasurements,
            history: recentWorkouts
        };
    }

    async getAvailability(userId: string) {
        const coachId = await this.getCoachId(userId);
        const coach = await this.coachesRepository.findOne({ where: { id: coachId } });
        return coach?.availabilityRules || [];
    }

    async updateAvailability(userId: string, rules: any[]) {
        const coachId = await this.getCoachId(userId);
        const coach = await this.coachesRepository.findOne({ where: { id: coachId } });
        if (!coach) throw new NotFoundException('Coach not found');

        coach.availabilityRules = rules;
        return this.coachesRepository.save(coach);
    }

    async getMyTimeOffRequests(userId: string, tenantId: string) {
        const coachId = await this.getCoachId(userId);
        return this.timeOffRepository.find({
            where: { coachId, tenantId },
            order: { createdAt: 'DESC' }
        });
    }

    async createTimeOffRequest(
        userId: string,
        tenantId: string,
        dto: { startDate: string; endDate: string; notes?: string }
    ) {
        const coachId = await this.getCoachId(userId);
        const request = this.timeOffRepository.create({
            coachId,
            tenantId,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            notes: dto.notes,
            status: 'pending',
        });
        return this.timeOffRepository.save(request);
    }
}

