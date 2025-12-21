import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto, SessionQueryDto } from './dto';

export interface ConflictResult {
    hasConflicts: boolean;
    conflicts: Array<{
        type: 'room' | 'coach' | 'client' | 'device';
        sessionId: string;
        message: string;
    }>;
}

@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
    ) { }

    async findAll(tenantId: string, query: SessionQueryDto): Promise<Session[]> {
        const qb = this.sessionRepository.createQueryBuilder('s')
            .where('s.tenant_id = :tenantId', { tenantId })
            .leftJoinAndSelect('s.room', 'room')
            .leftJoinAndSelect('s.coach', 'coach')
            .leftJoinAndSelect('coach.user', 'coachUser')
            .leftJoinAndSelect('s.client', 'client');

        if (query.studioId) {
            qb.andWhere('s.studio_id = :studioId', { studioId: query.studioId });
        }

        if (query.coachId) {
            qb.andWhere('s.coach_id = :coachId', { coachId: query.coachId });
        }

        if (query.clientId) {
            qb.andWhere('s.client_id = :clientId', { clientId: query.clientId });
        }

        if (query.from) {
            qb.andWhere('s.start_time >= :from', { from: query.from });
        }

        if (query.to) {
            qb.andWhere('s.end_time <= :to', { to: query.to });
        }

        if (query.status) {
            qb.andWhere('s.status = :status', { status: query.status });
        }

        return qb.orderBy('s.start_time', 'ASC').getMany();
    }

    async findOne(id: string, tenantId: string): Promise<Session> {
        const session = await this.sessionRepository.findOne({
            where: { id, tenantId },
            relations: ['room', 'coach', 'coach.user', 'client'],
        });
        if (!session) {
            throw new NotFoundException(`Session ${id} not found`);
        }
        return session;
    }

    async create(dto: CreateSessionDto, tenantId: string): Promise<Session> {
        // Check for conflicts
        const conflicts = await this.checkConflicts(dto, tenantId);
        if (conflicts.hasConflicts) {
            throw new BadRequestException({
                message: 'Scheduling conflict detected',
                conflicts: conflicts.conflicts,
            });
        }

        const session = this.sessionRepository.create({
            ...dto,
            tenantId,
        });

        return this.sessionRepository.save(session);
    }

    async checkConflicts(dto: CreateSessionDto, tenantId: string, excludeSessionId?: string): Promise<ConflictResult> {
        const conflicts: ConflictResult['conflicts'] = [];
        const excludedStatuses = ['cancelled'];

        const baseQuery = () => {
            const qb = this.sessionRepository.createQueryBuilder('s')
                .where('s.tenant_id = :tenantId', { tenantId })
                .andWhere('s.start_time < :endTime', { endTime: dto.endTime })
                .andWhere('s.end_time > :startTime', { startTime: dto.startTime })
                .andWhere('s.status NOT IN (:...excludedStatuses)', { excludedStatuses });

            if (excludeSessionId) {
                qb.andWhere('s.id != :excludeSessionId', { excludeSessionId });
            }

            return qb;
        };

        // Check room conflict
        const roomConflict = await baseQuery()
            .andWhere('s.room_id = :roomId', { roomId: dto.roomId })
            .getOne();

        if (roomConflict) {
            conflicts.push({
                type: 'room',
                sessionId: roomConflict.id,
                message: 'Room is already booked for this time slot',
            });
        }

        // Check coach conflict
        const coachConflict = await baseQuery()
            .andWhere('s.coach_id = :coachId', { coachId: dto.coachId })
            .getOne();

        if (coachConflict) {
            conflicts.push({
                type: 'coach',
                sessionId: coachConflict.id,
                message: 'Coach is already booked for this time slot',
            });
        }

        // Check client conflict
        const clientConflict = await baseQuery()
            .andWhere('s.client_id = :clientId', { clientId: dto.clientId })
            .getOne();

        if (clientConflict) {
            conflicts.push({
                type: 'client',
                sessionId: clientConflict.id,
                message: 'Client already has a session at this time',
            });
        }

        // Check EMS device conflict (if specified)
        if (dto.emsDeviceId) {
            const deviceConflict = await baseQuery()
                .andWhere('s.ems_device_id = :emsDeviceId', { emsDeviceId: dto.emsDeviceId })
                .getOne();

            if (deviceConflict) {
                conflicts.push({
                    type: 'device',
                    sessionId: deviceConflict.id,
                    message: 'EMS device is already in use for this time slot',
                });
            }
        }

        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
        };
    }

    async updateStatus(id: string, tenantId: string, status: Session['status']): Promise<Session> {
        const session = await this.findOne(id, tenantId);
        session.status = status;

        if (status === 'cancelled') {
            session.cancelledAt = new Date();
        }

        return this.sessionRepository.save(session);
    }
}
