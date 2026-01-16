import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto, SessionQueryDto, UpdateSessionDto } from './dto';
import { MailerService } from '../mailer/mailer.service';
import { ClientsService } from '../clients/clients.service';

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
    private readonly logger = new Logger(SessionsService.name);

    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        private mailerService: MailerService,
        private clientsService: ClientsService,
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

        const savedSession = await this.sessionRepository.save(session);

        // Send confirmation email
        try {
            const client = await this.clientsService.findOne(dto.clientId, tenantId);
            if (client && client.email) {
                await this.mailerService.sendMail(
                    client.email,
                    'Session Confirmed - EMS Studio',
                    `Your session has been scheduled for ${savedSession.startTime.toLocaleString()}.`,
                    `<p>Hi ${client.firstName},</p><p>Your session has been scheduled for <strong>${savedSession.startTime.toLocaleString()}</strong>.</p><p>See you there!</p>`
                );
            }
        } catch (error) {
            this.logger.error('Failed to send session confirmation email', error);
        }

        return savedSession;
    }

    async update(id: string, dto: UpdateSessionDto, tenantId: string): Promise<Session> {
        const session = await this.findOne(id, tenantId);

        // Merge existing session with new data to check conflicts correctly
        // We need to construct a "would-be" session object for conflict checking
        const mergedData = {
            ...session,
            ...dto,
            // Ensure IDs are strings
            studioId: dto.studioId || session.studioId,
            roomId: dto.roomId || session.roomId,
            coachId: dto.coachId || session.coachId,
            clientId: dto.clientId || session.clientId,
            startTime: dto.startTime ? new Date(dto.startTime) : session.startTime,
            endTime: dto.endTime ? new Date(dto.endTime) : session.endTime,
            emsDeviceId: dto.emsDeviceId !== undefined ? dto.emsDeviceId : session.emsDeviceId,
        };

        // If time or resources changed, check for conflicts
        if (dto.startTime || dto.endTime || dto.roomId || dto.coachId || dto.clientId || dto.emsDeviceId) {
            const checkDto: CreateSessionDto = {
                studioId: mergedData.studioId,
                roomId: mergedData.roomId,
                coachId: mergedData.coachId,
                clientId: mergedData.clientId,
                startTime: mergedData.startTime.toISOString(),
                endTime: mergedData.endTime.toISOString(),
                emsDeviceId: mergedData.emsDeviceId || undefined,
                // other fields irrelevant for conflict check
            };

            const conflicts = await this.checkConflicts(checkDto, tenantId, id);
            if (conflicts.hasConflicts) {
                throw new BadRequestException({
                    message: 'Scheduling conflict detected',
                    conflicts: conflicts.conflicts,
                });
            }
        }

        Object.assign(session, dto);
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
