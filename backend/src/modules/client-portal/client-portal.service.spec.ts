import { Test, TestingModule } from '@nestjs/testing';
import { ClientPortalService } from './client-portal.service';
import { SessionsService } from '../sessions/sessions.service';
import { PackagesService } from '../packages/packages.service';
import { WaitingListService } from '../waiting-list/waiting-list.service';
import { ClientsService } from '../clients/clients.service';
import { CoachesService } from '../coaches/coaches.service';
import { ClientPackageStatus } from '../packages/entities/client-package.entity';

describe('ClientPortalService', () => {
    let service: ClientPortalService;
    let sessionsService: jest.Mocked<SessionsService>;
    let packagesService: jest.Mocked<PackagesService>;
    let waitingListService: jest.Mocked<WaitingListService>;
    let clientsService: jest.Mocked<ClientsService>;
    let coachesService: jest.Mocked<CoachesService>;

    const mockClient = {
        id: 'client-123',
        tenantId: 'tenant-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        status: 'active',
        avatarUrl: null,
        createdAt: new Date(),
        user: { id: 'user-123', email: 'john@example.com', gender: 'male' },
    };

    const mockSession = {
        id: 'session-123',
        tenantId: 'tenant-123',
        clientId: 'client-123',
        coachId: 'coach-123',
        roomId: 'room-123',
        studioId: 'studio-123',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T10:20:00Z'),
        status: 'scheduled',
        room: { name: 'Room A' },
        coach: { user: { firstName: 'Coach', lastName: 'Smith' } },
    };

    const mockPackage = {
        id: 'pkg-123',
        clientId: 'client-123',
        sessionsRemaining: 5,
        sessionsUsed: 3,
        status: ClientPackageStatus.ACTIVE,
        expiryDate: new Date('2026-12-31'),
        package: { name: '10 Session Pack', totalSessions: 10 },
    };

    const mockWaitingEntry = {
        id: 'wait-123',
        clientId: 'client-123',
        studioId: 'studio-123',
        status: 'pending',
        preferredDate: new Date('2026-02-01'),
        preferredTimeSlot: '10:00-12:00',
        createdAt: new Date(),
        notifiedAt: null,
        studio: { id: 'studio-123', name: 'Downtown Studio' },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientPortalService,
                {
                    provide: SessionsService,
                    useValue: {
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        updateStatus: jest.fn(),
                        getAvailableSlots: jest.fn(),
                        findFirstActiveStudio: jest.fn(),
                        autoAssignResources: jest.fn(),
                    },
                },
                {
                    provide: PackagesService,
                    useValue: {
                        getClientPackages: jest.fn(),
                        getActivePackageForClient: jest.fn(),
                    },
                },
                {
                    provide: WaitingListService,
                    useValue: {
                        create: jest.fn(),
                        findOne: jest.fn(),
                        findByClient: jest.fn(),
                        remove: jest.fn(),
                    },
                },
                {
                    provide: ClientsService,
                    useValue: {
                        findOne: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: CoachesService,
                    useValue: {
                        findAll: jest.fn(),
                        findActive: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ClientPortalService>(ClientPortalService);
        sessionsService = module.get(SessionsService);
        packagesService = module.get(PackagesService);
        waitingListService = module.get(WaitingListService);
        clientsService = module.get(ClientsService);
        coachesService = module.get(CoachesService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboard', () => {
        beforeEach(() => {
            sessionsService.findAll.mockResolvedValue([mockSession] as any);
            packagesService.getClientPackages.mockResolvedValue([mockPackage] as any);
        });

        it('should return dashboard data with next session and active package', async () => {
            const result = await service.getDashboard('client-123', 'tenant-123');

            expect(result).toHaveProperty('nextSession');
            expect(result).toHaveProperty('activePackage');
        });

        it('should call sessionsService.findAll for upcoming sessions', async () => {
            await service.getDashboard('client-123', 'tenant-123');

            expect(sessionsService.findAll).toHaveBeenCalledWith(
                'tenant-123',
                expect.objectContaining({ clientId: 'client-123', status: 'scheduled' })
            );
        });

        it('should call packagesService.getClientPackages', async () => {
            await service.getDashboard('client-123', 'tenant-123');

            expect(packagesService.getClientPackages).toHaveBeenCalledWith('client-123', 'tenant-123');
        });
    });

    describe('getMySessions', () => {
        it('should return sessions for client', async () => {
            sessionsService.findAll.mockResolvedValue([mockSession] as any);

            const result = await service.getMySessions('client-123', 'tenant-123');

            expect(result).toEqual([mockSession]);
            expect(sessionsService.findAll).toHaveBeenCalledWith(
                'tenant-123',
                expect.objectContaining({ clientId: 'client-123' })
            );
        });

        it('should filter by date range when provided', async () => {
            sessionsService.findAll.mockResolvedValue([mockSession] as any);

            await service.getMySessions('client-123', 'tenant-123', '2026-02-01', '2026-02-28');

            expect(sessionsService.findAll).toHaveBeenCalledWith(
                'tenant-123',
                expect.objectContaining({
                    clientId: 'client-123',
                    from: '2026-02-01',
                    to: '2026-02-28',
                })
            );
        });
    });

    describe('bookSession', () => {
        const bookDto = {
            studioId: 'studio-123',
            startTime: '2026-02-01T10:00:00Z',
            endTime: '2026-02-01T10:20:00Z',
            coachId: 'coach-123',
        };

        beforeEach(() => {
            sessionsService.findFirstActiveStudio.mockResolvedValue('studio-123');
            sessionsService.autoAssignResources.mockResolvedValue({
                roomId: 'room-123',
                coachId: 'coach-123',
            });
            sessionsService.create.mockResolvedValue(mockSession as any);
        });

        it('should book a session successfully', async () => {
            const result = await service.bookSession('client-123', 'tenant-123', bookDto);

            expect(sessionsService.create).toHaveBeenCalled();
            expect(result).toBe(mockSession);
        });

        it('should auto-assign room and coach', async () => {
            await service.bookSession('client-123', 'tenant-123', bookDto);

            expect(sessionsService.autoAssignResources).toHaveBeenCalledWith(
                'tenant-123',
                'studio-123',
                expect.any(Date),
                expect.any(Date),
                'coach-123'
            );
        });

        it('should find default studio if not provided', async () => {
            const dtoNoStudio = { ...bookDto, studioId: undefined };

            await service.bookSession('client-123', 'tenant-123', dtoNoStudio);

            expect(sessionsService.findFirstActiveStudio).toHaveBeenCalledWith('tenant-123');
        });
    });

    describe('cancelSession', () => {
        beforeEach(() => {
            sessionsService.findOne.mockResolvedValue(mockSession as any);
            sessionsService.updateStatus.mockResolvedValue({ ...mockSession, status: 'cancelled' } as any);
        });

        it('should cancel session successfully', async () => {
            const result = await service.cancelSession('client-123', 'tenant-123', 'session-123');

            expect(sessionsService.updateStatus).toHaveBeenCalledWith(
                'session-123',
                'tenant-123',
                'cancelled',
                expect.any(Boolean)
            );
            expect(result.status).toBe('cancelled');
        });

        it('should throw error if session belongs to different client', async () => {
            sessionsService.findOne.mockResolvedValue({
                ...mockSession,
                clientId: 'different-client',
            } as any);

            await expect(
                service.cancelSession('client-123', 'tenant-123', 'session-123')
            ).rejects.toThrow('Unauthorized access to session');
        });
    });

    describe('getAvailableSlots', () => {
        it('should return available slots', async () => {
            const mockSlots = [
                { time: '10:00', status: 'available' },
                { time: '10:20', status: 'available' },
            ];
            sessionsService.getAvailableSlots.mockResolvedValue(mockSlots);
            sessionsService.findFirstActiveStudio.mockResolvedValue('studio-123');

            const result = await service.getAvailableSlots(
                'tenant-123',
                { studioId: 'studio-123' },
                '2026-02-01'
            );

            expect(result).toEqual(mockSlots);
        });
    });

    describe('joinWaitingList', () => {
        const waitDto = {
            studioId: 'studio-123',
            preferredDate: '2026-02-01',
            preferredTimeSlot: '10:00-12:00',
            notes: 'Please call me',
        };

        it('should add client to waiting list', async () => {
            waitingListService.create.mockResolvedValue(mockWaitingEntry as any);

            const result = await service.joinWaitingList('client-123', 'tenant-123', waitDto);

            expect(waitingListService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    clientId: 'client-123',
                    studioId: 'studio-123',
                    preferredDate: waitDto.preferredDate,
                    preferredTimeSlot: waitDto.preferredTimeSlot,
                }),
                'tenant-123'
            );
            expect(result).toBe(mockWaitingEntry);
        });

        it('should find default studio if not provided', async () => {
            const dtoNoStudio = { ...waitDto, studioId: undefined };
            sessionsService.findFirstActiveStudio.mockResolvedValue('studio-123');
            waitingListService.create.mockResolvedValue(mockWaitingEntry as any);

            await service.joinWaitingList('client-123', 'tenant-123', dtoNoStudio);

            expect(sessionsService.findFirstActiveStudio).toHaveBeenCalledWith('tenant-123');
        });
    });

    describe('getMyWaitingList', () => {
        it('should return formatted waiting list entries for client', async () => {
            waitingListService.findByClient.mockResolvedValue([mockWaitingEntry] as any);

            const result = await service.getMyWaitingList('client-123', 'tenant-123');

            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('preferredDate');
            expect(result[0]).toHaveProperty('status');
            expect(waitingListService.findByClient).toHaveBeenCalledWith('client-123', 'tenant-123');
        });
    });

    describe('cancelWaitingListEntry', () => {
        it('should remove waiting list entry', async () => {
            waitingListService.findOne.mockResolvedValue(mockWaitingEntry as any);
            waitingListService.remove.mockResolvedValue(undefined);

            const result = await service.cancelWaitingListEntry('client-123', 'tenant-123', 'wait-123');

            expect(waitingListService.remove).toHaveBeenCalledWith('wait-123', 'tenant-123');
            expect(result).toHaveProperty('message');
        });

        it('should throw error if entry belongs to different client', async () => {
            waitingListService.findOne.mockResolvedValue({
                ...mockWaitingEntry,
                clientId: 'different-client',
            } as any);

            await expect(
                service.cancelWaitingListEntry('client-123', 'tenant-123', 'wait-123')
            ).rejects.toThrow('You can only cancel your own waiting list entries');
        });
    });

    describe('getProfile', () => {
        it('should return client profile', async () => {
            clientsService.findOne.mockResolvedValue(mockClient as any);

            const result = await service.getProfile('client-123', 'tenant-123');

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('firstName');
            expect(result).toHaveProperty('lastName');
            expect(result).toHaveProperty('email');
            expect(clientsService.findOne).toHaveBeenCalledWith('client-123', 'tenant-123', ['user']);
        });

        it('should throw error if client not found', async () => {
            clientsService.findOne.mockResolvedValue(null);

            await expect(
                service.getProfile('nonexistent', 'tenant-123')
            ).rejects.toThrow('Client not found');
        });
    });

    describe('updateProfile', () => {
        const updateDto = {
            firstName: 'Jane',
            lastName: 'Doe',
            phone: '999-888-7777',
        };

        it('should update client profile', async () => {
            clientsService.findOne.mockResolvedValue(mockClient as any);
            clientsService.update.mockResolvedValue({ ...mockClient, ...updateDto } as any);

            const result = await service.updateProfile('client-123', 'tenant-123', updateDto);

            expect(clientsService.update).toHaveBeenCalledWith(
                'client-123',
                expect.objectContaining(updateDto),
                'tenant-123'
            );
            expect(result.firstName).toBe('Jane');
        });

        it('should throw error if client not found', async () => {
            clientsService.findOne.mockResolvedValue(null);

            await expect(
                service.updateProfile('nonexistent', 'tenant-123', updateDto)
            ).rejects.toThrow('Client not found');
        });
    });

    describe('getCoaches', () => {
        const mockCoaches = [
            { id: 'coach-1', user: { firstName: 'Coach', lastName: 'One' } },
            { id: 'coach-2', user: { firstName: 'Coach', lastName: 'Two' } },
        ];

        it('should return available coaches', async () => {
            clientsService.findOne.mockResolvedValue(mockClient as any);
            coachesService.findActive.mockResolvedValue(mockCoaches as any);

            const result = await service.getCoaches('client-123', 'tenant-123');

            expect(result).toEqual(mockCoaches);
            expect(coachesService.findActive).toHaveBeenCalledWith('tenant-123', 'male');
        });

        it('should throw error if client not found', async () => {
            clientsService.findOne.mockResolvedValue(null);

            await expect(
                service.getCoaches('nonexistent', 'tenant-123')
            ).rejects.toThrow('Client not found');
        });
    });
});
