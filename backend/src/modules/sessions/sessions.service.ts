import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { Room } from '../rooms/entities/room.entity';
import { Studio } from '../studios/entities/studio.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { CreateSessionDto, SessionQueryDto, UpdateSessionDto } from './dto';
import { MailerService } from '../mailer/mailer.service';
import { ClientsService } from '../clients/clients.service';
import { PackagesService } from '../packages/packages.service';

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
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        private mailerService: MailerService,
        private clientsService: ClientsService,
        private packagesService: PackagesService,
    ) { }

    async findAll(tenantId: string, query: SessionQueryDto): Promise<Session[]> {
        const qb = this.sessionRepository.createQueryBuilder('s')
            .where('s.tenant_id = :tenantId', { tenantId })
            .leftJoinAndSelect('s.room', 'room')
            .leftJoinAndSelect('s.coach', 'coach')
            .leftJoinAndSelect('coach.user', 'coachUser')
            .leftJoinAndSelect('s.client', 'client')
            .leftJoinAndSelect('s.review', 'review');

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

        // Validate gender preference
        if (dto.clientId) {
            await this.validateCoachGenderPreference(dto.coachId, dto.clientId, tenantId);
        }

        // Validate client has remaining sessions in their package
        if (dto.clientId) {
            await this.validateClientHasRemainingSessions(dto.clientId, tenantId);
        }

        // Check for conflicts
        const conflicts = await this.checkConflicts(dto, tenantId);
        if (conflicts.hasConflicts) {
            throw new BadRequestException({
                message: 'Scheduling conflict detected',
                conflicts: conflicts.conflicts,
            });
        }

        // Create the parent/first session
        const isRecurring = !!dto.recurrencePattern && !!dto.recurrenceEndDate;
        const session = this.sessionRepository.create({
            ...dto,
            tenantId,
            isRecurringParent: isRecurring,
            recurrencePattern: dto.recurrencePattern || null,
            recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null,
        });

        const savedSession = await this.sessionRepository.save(session);

        // Generate recurring sessions if pattern is set
        if (isRecurring) {
            await this.generateRecurringSessions(savedSession, dto, tenantId);
        }

        // Send confirmation email
        try {
            const client = await this.clientsService.findOne(dto.clientId, tenantId);
            if (client && client.email) {
                const recurrenceText = isRecurring ? ` (recurring ${dto.recurrencePattern})` : '';
                await this.mailerService.sendMail(
                    client.email,
                    'Session Confirmed - EMS Studio',
                    `Your session has been scheduled for ${savedSession.startTime.toLocaleString()}${recurrenceText}.`,
                    `<p>Hi ${client.firstName},</p><p>Your session has been scheduled for <strong>${savedSession.startTime.toLocaleString()}</strong>${recurrenceText}.</p><p>See you there!</p>`
                );
            }
        } catch (error) {
            this.logger.error('Failed to send session confirmation email', error);
        }

        return savedSession;
    }

    private async generateRecurringSessions(parentSession: Session, dto: CreateSessionDto, tenantId: string): Promise<void> {
        let recurrenceEndDate = new Date(dto.recurrenceEndDate!);
        const startTime = new Date(dto.startTime);
        const endTime = new Date(dto.endTime);
        const sessionDuration = endTime.getTime() - startTime.getTime();
        const sessionHour = startTime.getHours();
        const sessionMinutes = startTime.getMinutes();

        // Check client's active package for limits
        let maxSessionsFromPackage = Infinity;
        const clientPackages = await this.packagesService.getClientPackages(dto.clientId, tenantId);
        const activePackage = clientPackages.find(cp => cp.status === 'active');

        if (activePackage) {
            // Limit by remaining sessions (subtract 1 for the parent session)
            maxSessionsFromPackage = Math.max(0, activePackage.sessionsRemaining - 1);

            // Limit by package expiry date
            if (activePackage.expiryDate) {
                const packageExpiry = new Date(activePackage.expiryDate);
                if (packageExpiry < recurrenceEndDate) {
                    recurrenceEndDate = packageExpiry;
                    this.logger.log(`Limiting recurrence end date to package expiry: ${recurrenceEndDate.toISOString()}`);
                }
            }
        }

        const sessionsToCreate: Partial<Session>[] = [];

        // Get recurrence days or default to the parent session's day
        const recurrenceDays = dto.recurrenceDays?.length
            ? dto.recurrenceDays.map(d => Number(d))
            : [startTime.getDay()];

        // Calculate week interval based on pattern
        const weekInterval = dto.recurrencePattern === 'biweekly' ? 2 : 1;
        const isMonthly = dto.recurrencePattern === 'monthly';

        // Start from the beginning of the week after the start date
        let currentWeekStart = new Date(startTime);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Go to Sunday
        currentWeekStart.setHours(0, 0, 0, 0);

        // Move to next week to skip the parent session's week
        if (!isMonthly) {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7 * weekInterval);
        }

        while (sessionsToCreate.length < maxSessionsFromPackage) {
            if (isMonthly) {
                // For monthly, just add one month to the start date
                const nextDate = new Date(startTime);
                nextDate.setMonth(nextDate.getMonth() + sessionsToCreate.length + 1);

                if (nextDate > recurrenceEndDate) break;

                const conflicts = await this.checkConflicts({
                    ...dto,
                    startTime: nextDate.toISOString(),
                    endTime: new Date(nextDate.getTime() + sessionDuration).toISOString(),
                }, tenantId, parentSession.id);

                if (!conflicts.hasConflicts) {
                    sessionsToCreate.push(this.createRecurringSessionData(dto, nextDate, sessionDuration, tenantId, parentSession.id));
                }
            } else {
                // For weekly/biweekly, iterate through selected days
                for (const dayOfWeek of recurrenceDays) {
                    if (sessionsToCreate.length >= maxSessionsFromPackage) break;

                    const sessionDate = new Date(currentWeekStart);
                    sessionDate.setDate(sessionDate.getDate() + dayOfWeek);
                    sessionDate.setHours(sessionHour, sessionMinutes, 0, 0);

                    // Skip if before start time or after end date
                    if (sessionDate <= startTime) continue;
                    if (sessionDate > recurrenceEndDate) continue;

                    const conflicts = await this.checkConflicts({
                        ...dto,
                        startTime: sessionDate.toISOString(),
                        endTime: new Date(sessionDate.getTime() + sessionDuration).toISOString(),
                    }, tenantId, parentSession.id);

                    if (!conflicts.hasConflicts) {
                        sessionsToCreate.push(this.createRecurringSessionData(dto, sessionDate, sessionDuration, tenantId, parentSession.id));
                    } else {
                        this.logger.warn(`Skipping recurring session on ${sessionDate.toISOString()} due to conflict`);
                    }
                }

                currentWeekStart.setDate(currentWeekStart.getDate() + 7 * weekInterval);
            }

            // Safety check to prevent infinite loops
            if (currentWeekStart > recurrenceEndDate && !isMonthly) break;
            if (isMonthly && sessionsToCreate.length >= 12) break; // Max 12 monthly sessions
        }

        if (sessionsToCreate.length > 0) {
            await this.sessionRepository.save(sessionsToCreate);
            this.logger.log(`Created ${sessionsToCreate.length} recurring sessions for parent ${parentSession.id}`);
        }
    }

    private createRecurringSessionData(dto: CreateSessionDto, startTime: Date, durationMs: number, tenantId: string, parentSessionId: string): Partial<Session> {
        return {
            studioId: dto.studioId,
            roomId: dto.roomId,
            coachId: dto.coachId,
            clientId: dto.clientId,
            emsDeviceId: dto.emsDeviceId || null,
            startTime: startTime,
            endTime: new Date(startTime.getTime() + durationMs),
            programType: dto.programType || null,
            intensityLevel: dto.intensityLevel || null,
            notes: dto.notes || null,
            status: 'scheduled',
            tenantId,
            parentSessionId,
            isRecurringParent: false,
            recurrencePattern: null,
            recurrenceEndDate: null,
            recurrenceDays: null,
        };
    }

    private getNextOccurrence(date: Date, pattern: 'weekly' | 'biweekly' | 'monthly'): Date {
        const next = new Date(date);
        switch (pattern) {
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'biweekly':
                next.setDate(next.getDate() + 14);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
        }
        return next;
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
        const dayIndex = startTime.getDay(); // 0-6 where 0 is Sunday

        // Find rule for this day of week - handle both string ("monday") and numeric (1) formats
        const dayRule = coach.availabilityRules.find(rule => {
            if (rule.dayOfWeek === undefined || rule.dayOfWeek === null) return false;
            // Handle numeric dayOfWeek (0-6)
            if (typeof rule.dayOfWeek === 'number') {
                return rule.dayOfWeek === dayIndex;
            }
            // Handle string dayOfWeek ("sunday", "monday", etc.)
            if (typeof rule.dayOfWeek === 'string') {
                return rule.dayOfWeek.toLowerCase() === dayOfWeek;
            }
            return false;
        });

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

    private async validateClientHasRemainingSessions(clientId: string, tenantId: string): Promise<void> {
        const activePackage = await this.packagesService.getActivePackageForClient(clientId, tenantId);

        if (!activePackage) {
            throw new BadRequestException('Client does not have an active package. Please assign a package before scheduling sessions.');
        }

        // Count already scheduled sessions for this client that haven't been completed yet
        const scheduledSessionsCount = await this.sessionRepository.count({
            where: {
                clientId,
                tenantId,
                status: 'scheduled' as any
            }
        });

        // Calculate available sessions: remaining - already scheduled
        const availableSessions = activePackage.sessionsRemaining - scheduledSessionsCount;

        this.logger.log(`Client ${clientId}: Package has ${activePackage.sessionsRemaining} remaining, ${scheduledSessionsCount} already scheduled, ${availableSessions} available for new bookings`);

        if (availableSessions <= 0) {
            throw new BadRequestException(
                `Client has no available sessions for booking. ` +
                `Package sessions remaining: ${activePackage.sessionsRemaining}, ` +
                `Already scheduled: ${scheduledSessionsCount}. ` +
                `Please complete existing sessions or renew the package.`
            );
        }
    }

    private async validateCoachGenderPreference(coachId: string, clientId: string, tenantId: string): Promise<void> {
        const coach = await this.coachRepository.findOne({
            where: { id: coachId, tenantId },
            relations: ['user'] // Need user relation if coach gender matters (for future), but preference is on Coach entity
        });
        const client = await this.clientsService.findOne(clientId, tenantId);

        if (!coach || !client || !client.user) return; // Skip if data missing

        // 'preferredClientGender' is on Coach entity now.
        // Assuming client.user.gender was added to User entity

        // Types might be tricky if entity update not propagated to type system yet in IDE context,
        // but it should work at runtime. Casting as necessary.
        const coachPreference = (coach as any).preferredClientGender;
        const clientGender = (client.user as any).gender;

        if (coachPreference && coachPreference !== 'any') {
            if (clientGender && clientGender !== 'pnts' && coachPreference !== clientGender) {
                throw new BadRequestException(
                    `This coach prefers to work with ${coachPreference} clients.`
                );
            }
        }
    }

    async updateStatus(id: string, tenantId: string, status: Session['status'], deductSession?: boolean): Promise<Session> {
        this.logger.log(`updateStatus called: id=${id}, status=${status}`);
        const session = await this.findOne(id, tenantId);
        this.logger.log(`Found session: id=${session.id}, current status=${session.status}`);
        const previousStatus = session.status;
        session.status = status;

        if (status === 'cancelled') {
            session.cancelledAt = new Date();
        }

        // Determine if we should deduct a session from the client's package
        let shouldDeductSession = false;

        if (session.clientId && previousStatus !== status) {
            if (status === 'completed') {
                // Completed sessions always deduct
                shouldDeductSession = true;
            } else if (status === 'no_show') {
                // No-show always deducts (client didn't show up)
                shouldDeductSession = true;
                this.logger.log(`No-show for session ${id}, deducting session from package`);
            } else if (status === 'cancelled') {
                // For cancelled: check policy OR use deductSession override

                if (deductSession !== undefined) {
                    // Start of Admin Override logic:
                    // If an explicit override is provided (from Admin UI), respect it.
                    shouldDeductSession = deductSession;
                    this.logger.log(`Cancelled session ${id}: using admin override deductSession=${deductSession}`);
                } else {
                    // Client-side cancellation (no override provided) -> Use Policy
                    // Fetch Tenant Settings
                    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
                    // Default to 48 hours if not set
                    const cancellationWindowHours = tenant?.settings?.cancellationWindowHours || 48;

                    const now = new Date();
                    const sessionTime = new Date(session.startTime);
                    const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                    if (hoursUntilSession < cancellationWindowHours) {
                        shouldDeductSession = true; // Late cancellation
                        this.logger.log(`Late cancellation (${hoursUntilSession.toFixed(1)}h < ${cancellationWindowHours}h policy), deducting session.`);
                    } else {
                        shouldDeductSession = false; // On time
                        this.logger.log(`On-time cancellation (${hoursUntilSession.toFixed(1)}h >= ${cancellationWindowHours}h policy), NOT deducting.`);
                    }
                }
            }
        }

        if (shouldDeductSession && session.clientId) {
            try {
                // Optimized: Query directly for active package using PackagesService
                const activePackage = await this.packagesService.getActivePackageForClient(session.clientId, tenantId);

                if (activePackage) {
                    await this.packagesService.useSession(activePackage.id, tenantId);
                    this.logger.log(`Decremented session for client ${session.clientId}, package ${activePackage.id}`);
                } else {
                    this.logger.warn(`No active package found for client ${session.clientId}`);
                }
            } catch (error) {
                this.logger.error(`Failed to decrement session count: ${error.message}`);
            }
        }

        return this.sessionRepository.save(session);
    }
    async getAvailableSlots(tenantId: string, studioId: string, dateStr: string, coachId?: string): Promise<{ time: string, status: 'available' | 'full' }[]> {
        const date = new Date(dateStr);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Get Studio info (Opening Hours)
        const studio = await this.studioRepository.findOne({
            where: { id: studioId, tenantId },
            relations: ['rooms']
        });

        if (!studio) throw new NotFoundException('Studio not found');
        if (!studio.active) return [];

        // Check if studio is open on this day
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
        const hours = studio.openingHours?.[dayOfWeek];
        if (!hours) return []; // Closed

        const [openH, openM] = hours.open.split(':').map(Number);
        const [closeH, closeM] = hours.close.split(':').map(Number);

        // 2. Get Resources
        const rooms = studio.rooms.filter(r => r.active);
        let coaches = await this.coachRepository.find({ where: { tenantId, active: true } });

        // Filter by specific coach if requested
        if (coachId) {
            coaches = coaches.filter(c => c.id === coachId);
            // If requested coach is not found/active, coaches will be empty -> no slots
        }

        // 3. Get Existing Sessions
        const sessions = await this.sessionRepository.createQueryBuilder('s')
            .where('s.tenant_id = :tenantId', { tenantId })
            .andWhere('s.studio_id = :studioId', { studioId })
            .andWhere('s.start_time >= :start', { start: startOfDay })
            .andWhere('s.end_time <= :end', { end: endOfDay })
            .andWhere('s.status != :cancelled', { cancelled: 'cancelled' })
            .getMany();

        // 4. Generate Slots (20 min intervals)
        const slots: { time: string, status: 'available' | 'full' }[] = [];
        const slotDurationMin = 20;

        // Start from opening time
        const currentHook = new Date(date);
        currentHook.setHours(openH, openM, 0, 0);

        const closeTime = new Date(date);
        closeTime.setHours(closeH, closeM, 0, 0);

        while (currentHook.getTime() + slotDurationMin * 60000 <= closeTime.getTime()) {
            const slotStart = new Date(currentHook);
            const slotEnd = new Date(currentHook.getTime() + slotDurationMin * 60000);

            // Filter out past slots if date is today
            if (slotStart < new Date()) {
                currentHook.setMinutes(currentHook.getMinutes() + slotDurationMin);
                continue;
            }

            // Check Rooms
            const activeSessionsInSlot = sessions.filter(s =>
                (new Date(s.startTime) < slotEnd) && (new Date(s.endTime) > slotStart)
            );

            const bookedRoomIds = activeSessionsInSlot.map(s => s.roomId).filter(Boolean);
            const availableRooms = rooms.filter(r => !bookedRoomIds.includes(r.id));

            const bookedCoachIds = activeSessionsInSlot.map(s => s.coachId).filter(Boolean);
            const availableCoaches = coaches.filter(c => !bookedCoachIds.includes(c.id));

            const validCoaches = availableCoaches.filter(coach => {
                if (!coach.availabilityRules?.length) return true;

                // Find day rule - handle both string ("monday") and numeric (1) dayOfWeek formats
                const dayIndex = date.getDay(); // 0-6 where 0 is Sunday
                const dayRule = coach.availabilityRules.find(r => {
                    if (r.dayOfWeek === undefined || r.dayOfWeek === null) return false;
                    // Handle numeric dayOfWeek (0-6)
                    if (typeof r.dayOfWeek === 'number') {
                        return r.dayOfWeek === dayIndex;
                    }
                    // Handle string dayOfWeek ("sunday", "monday", etc.)
                    if (typeof r.dayOfWeek === 'string') {
                        return r.dayOfWeek.toLowerCase() === dayOfWeek;
                    }
                    return false;
                });

                // If no rule for this day OR rule says not available, coach is unavailable
                if (!dayRule || !dayRule.available) return false;

                // If rule has time ranges, validate against them
                if (dayRule.startTime && dayRule.endTime) {
                    const [sH, sM] = dayRule.startTime.split(':').map(Number);
                    const [eH, eM] = dayRule.endTime.split(':').map(Number);
                    const cStart = new Date(date); cStart.setHours(sH, sM, 0, 0);
                    const cEnd = new Date(date); cEnd.setHours(eH, eM, 0, 0);
                    return slotStart >= cStart && slotEnd <= cEnd;
                }
                return true;
            });

            const hoursStr = slotStart.getHours().toString().padStart(2, '0');
            const minsStr = slotStart.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hoursStr}:${minsStr}`;

            if (availableRooms.length > 0 && validCoaches.length > 0) {
                slots.push({ time: timeStr, status: 'available' });
            } else {
                slots.push({ time: timeStr, status: 'full' });
            }

            currentHook.setMinutes(currentHook.getMinutes() + slotDurationMin);
        }

        return slots;
    }

    async findFirstActiveStudio(tenantId: string): Promise<string | null> {
        const studio = await this.studioRepository.findOne({
            where: { tenantId, active: true },
            order: { createdAt: 'ASC' }
        });
        return studio ? studio.id : null;
    }

    async autoAssignResources(tenantId: string, studioId: string, start: Date, end: Date, preferredCoachId?: string): Promise<{ roomId: string, coachId: string }> {
        // 1. Get overlapping sessions to find occupied resources
        const overlappingSessions = await this.sessionRepository.createQueryBuilder('s')
            .where('s.tenant_id = :tenantId', { tenantId })
            .andWhere('s.studio_id = :studioId', { studioId })
            .andWhere('s.status != :cancelled', { cancelled: 'cancelled' })
            .andWhere('s.start_time < :end', { end })
            .andWhere('s.end_time > :start', { start })
            .getMany();

        const occupiedRoomIds = overlappingSessions.map(s => s.roomId).filter(Boolean);
        const occupiedCoachIds = overlappingSessions.map(s => s.coachId).filter(Boolean);

        // 2. Find available room
        const room = await this.roomRepository.findOne({
            where: { studioId, active: true, tenantId } // Assuming simple query
        });
        // Ideally we fetch ALL active rooms and pick one not in occupied list
        const allRooms = await this.roomRepository.find({ where: { studioId, active: true, tenantId } });
        const availableRoom = allRooms.find(r => !occupiedRoomIds.includes(r.id));

        if (!availableRoom) {
            throw new Error('No rooms available for this time slot');
        }

        // 3. Find available coach
        const allCoaches = await this.coachRepository.find({ where: { active: true, tenantId } });

        let availableCoach;

        if (preferredCoachId) {
            // If user selected a specific coach, check availability
            if (occupiedCoachIds.includes(preferredCoachId)) {
                throw new Error('Selected coach is already booked for this time slot');
            }
            availableCoach = allCoaches.find(c => c.id === preferredCoachId);
            if (!availableCoach) {
                // Could act as validation too
                throw new Error('Selected coach not found or inactive');
            }
        } else {
            // Auto-assign any open coach
            // Filter by studio if coaches are studio-scoped? Assuming global or linked.
            // For simplified MVP, just pick any available coach not occupied.
            availableCoach = allCoaches.find(c => !occupiedCoachIds.includes(c.id));
        }

        // Coach is optional? If booking REQUIRES coach, we throw.
        // Schema says coachId is UUID (required in DTO).
        if (!availableCoach) {
            // If strictly required
            throw new Error('No coaches available for this time slot');
        }

        return { roomId: availableRoom.id, coachId: availableCoach.id };
    }
}
