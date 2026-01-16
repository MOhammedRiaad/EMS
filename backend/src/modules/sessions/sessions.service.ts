import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { Room } from '../rooms/entities/room.entity';
import { Studio } from '../studios/entities/studio.entity';
import { Coach } from '../coaches/entities/coach.entity';
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
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
        @InjectRepository(Studio)
        private readonly studioRepository: Repository<Studio>,
        @InjectRepository(Coach)
        private readonly coachRepository: Repository<Coach>,
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
        const startTime = new Date(dto.startTime);
        const endTime = new Date(dto.endTime);

        // Validate room is active
        await this.validateRoomAvailability(dto.roomId, tenantId);

        // Validate studio opening hours
        await this.validateStudioHours(dto.studioId, startTime, endTime, tenantId);

        // Validate coach availability
        await this.validateCoachAvailability(dto.coachId, startTime, endTime, tenantId);

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

        // Validate room is active if room is being changed
        if (dto.roomId && dto.roomId !== session.roomId) {
            await this.validateRoomAvailability(dto.roomId, tenantId);
        }

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

        // Validate studio hours and coach availability if time or resources changed
        if (dto.startTime || dto.endTime || dto.studioId || dto.coachId) {
            await this.validateStudioHours(
                mergedData.studioId,
                mergedData.startTime,
                mergedData.endTime,
                tenantId
            );
            await this.validateCoachAvailability(
                mergedData.coachId,
                mergedData.startTime,
                mergedData.endTime,
                tenantId
            );
        }

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

    private async validateStudioHours(studioId: string, startTime: Date, endTime: Date, tenantId: string): Promise<void> {
        const studio = await this.studioRepository.findOne({
            where: { id: studioId, tenantId }
        });

        if (!studio) {
            throw new NotFoundException(`Studio ${studioId} not found`);
        }

        // If studio has no opening hours defined, allow all times
        if (!studio.openingHours || Object.keys(studio.openingHours).length === 0) {
            return;
        }

        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][startTime.getDay()];
        const hours = studio.openingHours[dayOfWeek];

        // If this day is not configured or is null (closed), reject
        if (!hours) {
            throw new BadRequestException(`Studio "${studio.name}" is closed on ${dayOfWeek}s`);
        }

        // Parse opening and closing times
        const [openHour, openMin] = hours.open.split(':').map(Number);
        const [closeHour, closeMin] = hours.close.split(':').map(Number);

        const sessionStart = startTime.getHours() * 60 + startTime.getMinutes();
        const sessionEnd = endTime.getHours() * 60 + endTime.getMinutes();
        const studioOpen = openHour * 60 + openMin;
        const studioClose = closeHour * 60 + closeMin;

        if (sessionStart < studioOpen || sessionEnd > studioClose) {
            throw new BadRequestException(
                `Session time (${hours.open}-${hours.close}) is outside studio hours for ${dayOfWeek}s (${hours.open}-${hours.close})`
            );
        }
    }

    private async validateCoachAvailability(coachId: string, startTime: Date, endTime: Date, tenantId: string): Promise<void> {
        const coach = await this.coachRepository.findOne({
            where: { id: coachId, tenantId }
        });

        if (!coach) {
            throw new NotFoundException(`Coach ${coachId} not found`);
        }

        // If coach has no availability rules defined, allow all times
        if (!coach.availabilityRules || coach.availabilityRules.length === 0) {
            return;
        }

        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][startTime.getDay()];

        // Find rule for this day of week
        const dayRule = coach.availabilityRules.find(
            rule => rule.dayOfWeek?.toLowerCase() === dayOfWeek
        );

        // If no rule for this day, coach is unavailable
        if (!dayRule || !dayRule.available) {
            throw new BadRequestException(`Coach is not available on ${dayOfWeek}s`);
        }

        // If rule has time ranges, validate against them
        if (dayRule.startTime && dayRule.endTime) {
            const [startHour, startMin] = dayRule.startTime.split(':').map(Number);
            const [endHour, endMin] = dayRule.endTime.split(':').map(Number);

            const sessionStart = startTime.getHours() * 60 + startTime.getMinutes();
            const sessionEnd = endTime.getHours() * 60 + endTime.getMinutes();
            const coachStart = startHour * 60 + startMin;
            const coachEnd = endHour * 60 + endMin;

            if (sessionStart < coachStart || sessionEnd > coachEnd) {
                throw new BadRequestException(
                    `Coach is only available on ${dayOfWeek}s from ${dayRule.startTime} to ${dayRule.endTime}`
                );
            }
        }
    }

    private async validateRoomAvailability(roomId: string, tenantId: string): Promise<void> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId, tenantId }
        });

        if (!room) {
            throw new NotFoundException(`Room ${roomId} not found`);
        }

        if (!room.active) {
            throw new BadRequestException(`Room "${room.name}" is currently unavailable (maintenance or closed)`);
        }
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
