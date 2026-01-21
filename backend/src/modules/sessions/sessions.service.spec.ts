import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionsService, ConflictResult } from './sessions.service';
import { Session } from './entities/session.entity';
import { Room } from '../rooms/entities/room.entity';
import { Studio } from '../studios/entities/studio.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { MailerService } from '../mailer/mailer.service';
import { ClientsService } from '../clients/clients.service';
import { PackagesService } from '../packages/packages.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SessionsService', () => {
    let service: SessionsService;
    let sessionRepository: jest.Mocked<Repository<Session>>;
    let roomRepository: jest.Mocked<Repository<Room>>;
    let studioRepository: jest.Mocked<Repository<Studio>>;
    let coachRepository: jest.Mocked<Repository<Coach>>;
    let tenantRepository: jest.Mocked<Repository<Tenant>>;
    let mailerService: jest.Mocked<MailerService>;
    let clientsService: jest.Mocked<ClientsService>;
    let packagesService: jest.Mocked<PackagesService>;

    const mockSession = {
        id: 'session-123',
        tenantId: 'tenant-123',
        studioId: 'studio-123',
        roomId: 'room-123',
        coachId: 'coach-123',
        clientId: 'client-123',
        startTime: new Date('2026-01-25T10:00:00Z'),
        endTime: new Date('2026-01-25T10:20:00Z'),
        status: 'scheduled',
        room: { id: 'room-123', name: 'Room A', active: true },
        coach: { id: 'coach-123', user: { firstName: 'John' } },
        client: { id: 'client-123', firstName: 'Jane' },
    } as Session;

    const mockRoom = {
        id: 'room-123',
        tenantId: 'tenant-123',
        name: 'Room A',
        active: true,
    } as Room;

    const mockStudio = {
        id: 'studio-123',
        tenantId: 'tenant-123',
        name: 'Downtown Studio',
        active: true,
        openingHours: {
            monday: { open: '07:00', close: '21:00' },
            tuesday: { open: '07:00', close: '21:00' },
            wednesday: { open: '07:00', close: '21:00' },
            thursday: { open: '07:00', close: '21:00' },
            friday: { open: '07:00', close: '21:00' },
            saturday: { open: '09:00', close: '17:00' },
            sunday: null,
        },
    } as Studio;

    const mockCoach = {
        id: 'coach-123',
        tenantId: 'tenant-123',
        active: true,
        availabilityRules: [
            { dayOfWeek: 1, available: true, startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 2, available: true, startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 3, available: true, startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 4, available: true, startTime: '08:00', endTime: '18:00' },
            { dayOfWeek: 5, available: true, startTime: '08:00', endTime: '18:00' },
        ],
        user: { firstName: 'Coach', lastName: 'Smith' },
    } as Coach;

    const mockActivePackage = {
        id: 'pkg-123',
        sessionsRemaining: 5,
        status: 'active',
        expiryDate: new Date('2026-12-31'),
    };

    const createMockQueryBuilder = (results: any[] = []) => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(results),
        getOne: jest.fn().mockResolvedValue(results[0] || null),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionsService,
                {
                    provide: getRepositoryToken(Session),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        count: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Room),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Studio),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Coach),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Tenant),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendMail: jest.fn().mockResolvedValue(undefined),
                    },
                },
                {
                    provide: ClientsService,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: PackagesService,
                    useValue: {
                        getActivePackageForClient: jest.fn(),
                        getClientPackages: jest.fn(),
                        useSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<SessionsService>(SessionsService);
        sessionRepository = module.get(getRepositoryToken(Session));
        roomRepository = module.get(getRepositoryToken(Room));
        studioRepository = module.get(getRepositoryToken(Studio));
        coachRepository = module.get(getRepositoryToken(Coach));
        tenantRepository = module.get(getRepositoryToken(Tenant));
        mailerService = module.get(MailerService);
        clientsService = module.get(ClientsService);
        packagesService = module.get(PackagesService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findOne', () => {
        it('should return session by id', async () => {
            sessionRepository.findOne.mockResolvedValue(mockSession);

            const result = await service.findOne('session-123', 'tenant-123');

            expect(result).toBe(mockSession);
            expect(sessionRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'session-123', tenantId: 'tenant-123' },
                relations: ['room', 'coach', 'coach.user', 'client'],
            });
        });

        it('should throw NotFoundException if session not found', async () => {
            sessionRepository.findOne.mockResolvedValue(null);

            await expect(
                service.findOne('nonexistent', 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('checkConflicts', () => {
        const createDto = {
            studioId: 'studio-123',
            roomId: 'room-123',
            coachId: 'coach-123',
            clientId: 'client-123',
            startTime: '2026-01-25T10:00:00Z',
            endTime: '2026-01-25T10:20:00Z',
        };

        beforeEach(() => {
            const mockQb = createMockQueryBuilder([]);
            sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);
        });

        it('should return no conflicts when all resources available', async () => {
            const result = await service.checkConflicts(createDto, 'tenant-123');

            expect(result.hasConflicts).toBe(false);
            expect(result.conflicts).toHaveLength(0);
        });

        it('should detect room conflict', async () => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn()
                    .mockResolvedValueOnce({ id: 'conflicting-session', roomId: 'room-123' }) // Room conflict
                    .mockResolvedValueOnce(null) // No coach conflict
                    .mockResolvedValueOnce(null), // No client conflict
            };
            sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);

            const result = await service.checkConflicts(createDto, 'tenant-123');

            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts.some(c => c.type === 'room')).toBe(true);
        });

        it('should detect coach conflict', async () => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn()
                    .mockResolvedValueOnce(null) // No room conflict
                    .mockResolvedValueOnce({ id: 'conflicting-session', coachId: 'coach-123' }) // Coach conflict
                    .mockResolvedValueOnce(null), // No client conflict
            };
            sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);

            const result = await service.checkConflicts(createDto, 'tenant-123');

            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts.some(c => c.type === 'coach')).toBe(true);
        });

        it('should detect client conflict', async () => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn()
                    .mockResolvedValueOnce(null) // No room conflict
                    .mockResolvedValueOnce(null) // No coach conflict
                    .mockResolvedValueOnce({ id: 'conflicting-session', clientId: 'client-123' }), // Client conflict
            };
            sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);

            const result = await service.checkConflicts(createDto, 'tenant-123');

            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts.some(c => c.type === 'client')).toBe(true);
        });

        it('should detect device conflict when device specified', async () => {
            const dtoWithDevice = { ...createDto, emsDeviceId: 'device-123' };
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn()
                    .mockResolvedValueOnce(null) // No room conflict
                    .mockResolvedValueOnce(null) // No coach conflict
                    .mockResolvedValueOnce(null) // No client conflict
                    .mockResolvedValueOnce({ id: 'conflicting-session', emsDeviceId: 'device-123' }), // Device conflict
            };
            sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);

            const result = await service.checkConflicts(dtoWithDevice, 'tenant-123');

            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts.some(c => c.type === 'device')).toBe(true);
        });

        it('should detect multiple conflicts', async () => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn()
                    .mockResolvedValueOnce({ id: 'session-1', roomId: 'room-123' }) // Room conflict
                    .mockResolvedValueOnce({ id: 'session-2', coachId: 'coach-123' }) // Coach conflict
                    .mockResolvedValueOnce(null), // No client conflict
            };
            sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);

            const result = await service.checkConflicts(createDto, 'tenant-123');

            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts).toHaveLength(2);
        });

        it('should exclude specific session when updating', async () => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
            };
            sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);

            await service.checkConflicts(createDto, 'tenant-123', 'exclude-session-id');

            expect(mockQb.andWhere).toHaveBeenCalledWith(
                's.id != :excludeSessionId',
                { excludeSessionId: 'exclude-session-id' }
            );
        });
    });

    describe('validateRoomAvailability (private - tested via create)', () => {
        it('should throw NotFoundException if room not found', async () => {
            roomRepository.findOne.mockResolvedValue(null);
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(mockCoach);
            packagesService.getActivePackageForClient.mockResolvedValue(mockActivePackage as any);
            sessionRepository.count.mockResolvedValue(0);
            sessionRepository.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);

            const createDto = {
                studioId: 'studio-123',
                roomId: 'nonexistent-room',
                coachId: 'coach-123',
                clientId: 'client-123',
                startTime: '2026-01-27T10:00:00Z', // Monday
                endTime: '2026-01-27T10:20:00Z',
            };

            await expect(
                service.create(createDto, 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if room is inactive', async () => {
            roomRepository.findOne.mockResolvedValue({ ...mockRoom, active: false });
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(mockCoach);
            packagesService.getActivePackageForClient.mockResolvedValue(mockActivePackage as any);
            sessionRepository.count.mockResolvedValue(0);

            const createDto = {
                studioId: 'studio-123',
                roomId: 'room-123',
                coachId: 'coach-123',
                clientId: 'client-123',
                startTime: '2026-01-27T10:00:00Z', // Monday
                endTime: '2026-01-27T10:20:00Z',
            };

            await expect(
                service.create(createDto, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('validateStudioHours (private - tested via create)', () => {
        it('should throw BadRequestException if studio is closed on that day', async () => {
            // Use a Sunday date which is closed in mockStudio
            roomRepository.findOne.mockResolvedValue(mockRoom);
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(mockCoach);
            packagesService.getActivePackageForClient.mockResolvedValue(mockActivePackage as any);
            sessionRepository.count.mockResolvedValue(0);
            sessionRepository.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);

            // January 26, 2026 is a Sunday
            const createDto = {
                studioId: 'studio-123',
                roomId: 'room-123',
                coachId: 'coach-123',
                clientId: 'client-123',
                startTime: '2026-01-25T10:00:00Z', // Sunday in UTC
                endTime: '2026-01-25T10:20:00Z',
            };

            await expect(
                service.create(createDto, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('validateCoachAvailability (private - tested via create)', () => {
        it('should throw NotFoundException if coach not found', async () => {
            roomRepository.findOne.mockResolvedValue(mockRoom);
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(null);

            const createDto = {
                studioId: 'studio-123',
                roomId: 'room-123',
                coachId: 'nonexistent-coach',
                clientId: 'client-123',
                startTime: '2026-01-27T10:00:00Z',
                endTime: '2026-01-27T10:20:00Z',
            };

            await expect(
                service.create(createDto, 'tenant-123')
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('validateClientHasRemainingSessions (private - tested via create)', () => {
        it('should throw BadRequestException if client has no active package', async () => {
            roomRepository.findOne.mockResolvedValue(mockRoom);
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(mockCoach);
            packagesService.getActivePackageForClient.mockResolvedValue(null);

            const createDto = {
                studioId: 'studio-123',
                roomId: 'room-123',
                coachId: 'coach-123',
                clientId: 'client-123',
                startTime: '2026-01-27T10:00:00Z',
                endTime: '2026-01-27T10:20:00Z',
            };

            await expect(
                service.create(createDto, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if all sessions already scheduled', async () => {
            roomRepository.findOne.mockResolvedValue(mockRoom);
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(mockCoach);
            packagesService.getActivePackageForClient.mockResolvedValue({
                ...mockActivePackage,
                sessionsRemaining: 2,
            } as any);
            sessionRepository.count.mockResolvedValue(2); // Already 2 scheduled

            const createDto = {
                studioId: 'studio-123',
                roomId: 'room-123',
                coachId: 'coach-123',
                clientId: 'client-123',
                startTime: '2026-01-27T10:00:00Z',
                endTime: '2026-01-27T10:20:00Z',
            };

            await expect(
                service.create(createDto, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('create', () => {
        const createDto = {
            studioId: 'studio-123',
            roomId: 'room-123',
            coachId: 'coach-123',
            clientId: 'client-123',
            startTime: '2026-01-27T10:00:00Z', // Monday
            endTime: '2026-01-27T10:20:00Z',
        };

        beforeEach(() => {
            roomRepository.findOne.mockResolvedValue(mockRoom);
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(mockCoach);
            packagesService.getActivePackageForClient.mockResolvedValue(mockActivePackage as any);
            packagesService.getClientPackages.mockResolvedValue([mockActivePackage] as any);
            sessionRepository.count.mockResolvedValue(0);
            sessionRepository.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
            sessionRepository.create.mockReturnValue(mockSession);
            sessionRepository.save.mockResolvedValue(mockSession);
            clientsService.findOne.mockResolvedValue({ email: 'test@example.com', firstName: 'Jane' } as any);
        });

        it('should create a session successfully', async () => {
            const result = await service.create(createDto, 'tenant-123');

            expect(sessionRepository.create).toHaveBeenCalled();
            expect(sessionRepository.save).toHaveBeenCalled();
            expect(result).toBe(mockSession);
        });

        it('should send confirmation email', async () => {
            await service.create(createDto, 'tenant-123');

            expect(mailerService.sendMail).toHaveBeenCalledWith(
                'test@example.com',
                expect.stringContaining('Session Confirmed'),
                expect.any(String),
                expect.any(String)
            );
        });

        it('should throw BadRequestException on scheduling conflict', async () => {
            const conflictQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue({ id: 'conflicting-session' }),
            };
            sessionRepository.createQueryBuilder.mockReturnValue(conflictQb as any);

            await expect(
                service.create(createDto, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateStatus', () => {
        beforeEach(() => {
            sessionRepository.findOne.mockResolvedValue(mockSession);
            sessionRepository.save.mockImplementation(async (s) => s as Session);
            packagesService.getActivePackageForClient.mockResolvedValue(mockActivePackage as any);
            packagesService.useSession.mockResolvedValue(undefined as any);
        });

        it('should update session status to completed and deduct session', async () => {
            // Use a fresh mock session with 'in_progress' status
            const inProgressSession = {
                ...mockSession,
                status: 'in_progress' as const,
            };
            sessionRepository.findOne.mockResolvedValue(inProgressSession);

            const result = await service.updateStatus('session-123', 'tenant-123', 'completed');

            expect(result.status).toBe('completed');
            expect(sessionRepository.save).toHaveBeenCalled();
            expect(packagesService.useSession).toHaveBeenCalled();
        });

        it('should deduct session on no_show', async () => {
            const scheduledSession = { ...mockSession, status: 'scheduled' as const };
            sessionRepository.findOne.mockResolvedValue(scheduledSession);

            await service.updateStatus('session-123', 'tenant-123', 'no_show');

            expect(packagesService.useSession).toHaveBeenCalled();
        });

        it('should set cancelledAt when cancelling', async () => {
            const scheduledSession = { ...mockSession, status: 'scheduled' as const };
            sessionRepository.findOne.mockResolvedValue(scheduledSession);
            tenantRepository.findOne.mockResolvedValue({ settings: { cancellationWindowHours: 48 } } as any);

            const result = await service.updateStatus('session-123', 'tenant-123', 'cancelled');

            expect(result.cancelledAt).toBeInstanceOf(Date);
        });

        it('should respect deductSession override on cancellation', async () => {
            const scheduledSession = { ...mockSession, status: 'scheduled' as const };
            sessionRepository.findOne.mockResolvedValue(scheduledSession);

            await service.updateStatus('session-123', 'tenant-123', 'cancelled', true);

            expect(packagesService.useSession).toHaveBeenCalled();
        });

        it('should not deduct when deductSession is false', async () => {
            const scheduledSession = { ...mockSession, status: 'scheduled' as const };
            sessionRepository.findOne.mockResolvedValue(scheduledSession);

            await service.updateStatus('session-123', 'tenant-123', 'cancelled', false);

            expect(packagesService.useSession).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        const updateDto = {
            notes: 'Updated notes',
        };

        beforeEach(() => {
            sessionRepository.findOne.mockResolvedValue(mockSession);
            sessionRepository.save.mockImplementation(async (s) => s as Session);
            roomRepository.findOne.mockResolvedValue(mockRoom);
            studioRepository.findOne.mockResolvedValue(mockStudio);
            coachRepository.findOne.mockResolvedValue(mockCoach);
            sessionRepository.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]) as any);
        });

        it('should update session successfully', async () => {
            const result = await service.update('session-123', updateDto, 'tenant-123');

            expect(result.notes).toBe('Updated notes');
            expect(sessionRepository.save).toHaveBeenCalled();
        });

        it('should validate room if room is changed', async () => {
            await service.update('session-123', { roomId: 'room-456' }, 'tenant-123');

            expect(roomRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'room-456', tenantId: 'tenant-123' },
            });
        });

        it('should check conflicts if time is changed', async () => {
            await service.update('session-123', {
                startTime: '2026-01-27T11:00:00Z',
                endTime: '2026-01-27T11:20:00Z',
            }, 'tenant-123');

            expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();
        });

        it('should throw on conflict during update', async () => {
            // Need a session with proper Date objects
            const sessionWithDates = {
                ...mockSession,
                startTime: new Date('2026-01-27T10:00:00Z'),
                endTime: new Date('2026-01-27T10:20:00Z'),
            };
            sessionRepository.findOne.mockResolvedValue(sessionWithDates);

            const conflictQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue({ id: 'other-session' }),
            };
            sessionRepository.createQueryBuilder.mockReturnValue(conflictQb as any);

            await expect(
                service.update('session-123', {
                    roomId: 'room-456', // Change room to trigger conflict check
                }, 'tenant-123')
            ).rejects.toThrow(BadRequestException);
        });
    });
});
