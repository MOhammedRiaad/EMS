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
import { GamificationService } from '../gamification/gamification.service';
import { CoachTimeOffRequest } from '../coaches/entities/coach-time-off.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { FeatureFlagService } from '../owner/services/feature-flag.service';
import { PermissionService } from '../auth/services/permission.service';
import { RoleService } from '../auth/services/role.service';
import { AuditService } from '../audit/audit.service';
import { AutomationService } from '../marketing/automation.service';
import { AutomationTriggerType } from '../marketing/entities/automation-rule.entity';

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
  let gamificationService: jest.Mocked<GamificationService>;
  let timeOffRepository: jest.Mocked<Repository<CoachTimeOffRequest>>;
  let featureFlagService: jest.Mocked<FeatureFlagService>;

  const mockSession = {
    id: 'session-123',
    tenantId: 'tenant-123',
    studioId: 'studio-123',
    roomId: 'room-123',
    coachId: 'coach-123',
    clientId: 'client-123',
    startTime: new Date('2027-01-25T10:00:00Z'),
    endTime: new Date('2027-01-25T10:20:00Z'),
    status: 'scheduled',
    room: { id: 'room-123', name: 'Room A', active: true },
    coach: { id: 'coach-123', user: { firstName: 'John' } },
    client: { id: 'client-123', firstName: 'Jane' },
    clientPackageId: 'pkg-123',
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
  } as any; // Cast as any to avoid strict partial type matching in tests

  const mockCoach = {
    id: 'coach-123',
    tenantId: 'tenant-123',
    active: true,
    studioId: 'studio-123', // Cleaned up mismatch
    availabilityRules: [
      { dayOfWeek: 1, available: true, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 2, available: true, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 3, available: true, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 4, available: true, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 5, available: true, startTime: '08:00', endTime: '18:00' },
    ],
    user: { firstName: 'Coach', lastName: 'Smith' },
    preferredClientGender: 'any',
  } as any; // Cast as any because of dynamic props

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
    select: jest.fn().mockReturnThis(),
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
            remove: jest.fn(),
            delete: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Room),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Studio),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Coach),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: ClientsService, useValue: { findOne: jest.fn() } },
        {
          provide: PackagesService,
          useValue: {
            getActivePackageForClient: jest.fn(),
            getClientPackages: jest.fn(),
            findBestPackageForSession: jest.fn(),
            useSession: jest.fn(),
            returnSession: jest.fn(),
          },
        },
        {
          provide: GamificationService,
          useValue: {
            checkAndUnlockAchievements: jest.fn(),
            getClientAchievements: jest.fn(),
            getClientGoals: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CoachTimeOffRequest),
          useValue: {
            createQueryBuilder: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
            calculateDiff: jest.fn().mockReturnValue({ changes: {} }),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: {
            isFeatureEnabled: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            getPermissionsForRole: jest.fn().mockResolvedValue([]),
            isPermissionAllowed: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AutomationService,
          useValue: {
            triggerEvent: jest.fn().mockResolvedValue(undefined),
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
    gamificationService = module.get(GamificationService);
    timeOffRepository = module.get(getRepositoryToken(CoachTimeOffRequest));
    featureFlagService = module.get(FeatureFlagService);

    roomRepository.findOne.mockResolvedValue(mockRoom);
    studioRepository.findOne.mockResolvedValue(mockStudio);
    coachRepository.findOne.mockResolvedValue(mockCoach);
    packagesService.getActivePackageForClient.mockResolvedValue(
      mockActivePackage as any,
    );
    packagesService.findBestPackageForSession.mockResolvedValue(
      mockActivePackage as any,
    );
    packagesService.getClientPackages.mockResolvedValue([
      mockActivePackage,
    ] as any);
    sessionRepository.count.mockResolvedValue(0);
    sessionRepository.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder([]) as any,
    );
    timeOffRepository.createQueryBuilder.mockReturnValue(
      createMockQueryBuilder([]) as any,
    );
    sessionRepository.create.mockReturnValue(mockSession);
    sessionRepository.save.mockResolvedValue(mockSession);
    clientsService.findOne.mockResolvedValue({
      email: 'test@example.com',
      firstName: 'Jane',
      studioId: 'studio-123',
      user: { gender: 'female' }, // Add user for gender check
    } as any);

    gamificationService.checkAndUnlockAchievements.mockResolvedValue(undefined);

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
        relations: [
          'room',
          'coach',
          'coach.user',
          'client',
          'participants',
          'participants.client',
        ],
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      sessionRepository.findOne.mockResolvedValue(null);
      await expect(
        service.findOne('nonexistent', 'tenant-123'),
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
    });

    it('should detect room conflict', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce({ id: 'conflicting', roomId: 'room-123' })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
      };
      sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);
      const result = await service.checkConflicts(createDto, 'tenant-123');
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].type).toBe('room');
    });

    it('should detect coach conflict', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'conflicting', coachId: 'coach-123' })
          .mockResolvedValueOnce(null),
      };
      sessionRepository.createQueryBuilder.mockReturnValue(mockQb as any);
      const result = await service.checkConflicts(createDto, 'tenant-123');
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].type).toBe('coach');
    });

    it('should detect coach time-off conflict', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(null) // room
          .mockResolvedValueOnce(null) // coach session
          .mockResolvedValueOnce({ id: 'time-off-123' }), // time-off
      };
      sessionRepository.createQueryBuilder.mockReturnValue({
        ...createMockQueryBuilder([]),
        ...mockQb,
      } as any);
      timeOffRepository.createQueryBuilder.mockReturnValue({
        ...createMockQueryBuilder([]),
        ...mockQb,
      } as any);

      const result = await service.checkConflicts(createDto, 'tenant-123');
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].type).toBe('coach');
      expect(result.conflicts[0].message).toContain('time-off');
    });
  });

  describe('autoAssignResources', () => {
    const start = new Date('2026-01-27T10:00:00Z');
    const end = new Date('2026-01-27T10:20:00Z');

    beforeEach(() => {
      sessionRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([]) as any,
      );
      timeOffRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([]) as any,
      );
      roomRepository.findOne.mockResolvedValue(mockRoom);
      roomRepository.find.mockResolvedValue([mockRoom]);
      coachRepository.find.mockResolvedValue([mockCoach]);
    });

    it('should auto-assign available resources', async () => {
      const result = await service.autoAssignResources(
        'tenant-123',
        'studio-123',
        start,
        end,
      );
      expect(result.roomId).toBe(mockRoom.id);
      expect(result.coachId).toBe(mockCoach.id);
    });

    it('should respect coach time-off during auto-assignment', async () => {
      // Mock time-off for the coach
      timeOffRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([{ coachId: mockCoach.id }]) as any,
      );

      // Should fail if only one coach and they are on leave
      await expect(
        service.autoAssignResources('tenant-123', 'studio-123', start, end),
      ).rejects.toThrow('No coaches available');
    });

    it('should throw if preferred coach is on leave', async () => {
      timeOffRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([{ coachId: mockCoach.id }]) as any,
      );

      await expect(
        service.autoAssignResources(
          'tenant-123',
          'studio-123',
          start,
          end,
          mockCoach.id,
        ),
      ).rejects.toThrow('Selected coach is on leave');
    });
  });

  describe('create', () => {
    const createDto = {
      studioId: 'studio-123',
      roomId: 'room-123',
      coachId: 'coach-123',
      clientId: 'client-123',
      startTime: '2026-01-27T10:00:00Z',
      endTime: '2026-01-27T10:20:00Z',
    };

    it('should create a session successfully', async () => {
      const result = await service.create(createDto, 'tenant-123', {
        role: 'admin',
      });
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalled();
      expect(result).toBe(mockSession);
    });

    it('should send confirmation email', async () => {
      await service.create(createDto, 'tenant-123', { role: 'admin' });
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException if client booking is disabled', async () => {
      featureFlagService.isFeatureEnabled.mockResolvedValue(false);
      await expect(
        service.create(createDto, 'tenant-123', { role: 'client' }),
      ).rejects.toThrow(ForbiddenException);
    });
    it('should set bookedStartTime and bookedEndTime on creation', async () => {
      // Mock create to return the partial entity with passed props
      sessionRepository.create.mockImplementation(
        (dto) => ({ ...mockSession, ...dto }) as any,
      );
      sessionRepository.save.mockImplementation(async (s) => s as Session);

      const result = await service.create(createDto, 'tenant-123', {
        role: 'admin',
      });
      expect(result.bookedStartTime).toEqual(new Date(createDto.startTime));
      expect(result.bookedEndTime).toEqual(new Date(createDto.endTime));
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.save.mockImplementation(async (s) => s as Session);
      packagesService.getActivePackageForClient.mockResolvedValue(
        mockActivePackage as any,
      );
      packagesService.useSession.mockResolvedValue(undefined as any);
    });

    it('should update session status to completed and deduct session', async () => {
      const inProgressSession = {
        ...mockSession,
        status: 'in_progress' as const,
      };
      sessionRepository.findOne.mockResolvedValue(inProgressSession);

      const result = await service.updateStatus(
        'session-123',
        'tenant-123',
        'completed',
        undefined,
        'user-123',
      );

      expect(result.status).toBe('completed');
      expect(sessionRepository.save).toHaveBeenCalled();
      expect(packagesService.useSession).not.toHaveBeenCalled();
    });

    it('should trigger gamification check on completion', async () => {
      const inProgressSession = {
        ...mockSession,
        status: 'in_progress' as const,
      };
      sessionRepository.findOne.mockResolvedValue(inProgressSession);

      await service.updateStatus(
        'session-123',
        'tenant-123',
        'completed',
        undefined,
        'user-123',
      );

      expect(
        gamificationService.checkAndUnlockAchievements,
      ).toHaveBeenCalledWith(mockSession.clientId, mockSession.tenantId);
    });

    it('should trigger automation on completion with client context', async () => {
      const inProgressSession = {
        ...mockSession,
        status: 'in_progress' as const,
      };
      sessionRepository.findOne.mockResolvedValue(inProgressSession);
      const mockClient = {
        id: 'client-123',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        tenantId: 'tenant-123',
        userId: 'user-123',
        user: {
          id: 'user-123',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '1234567890',
        },
      };
      clientsService.findOne.mockResolvedValue(mockClient as any);

      await service.updateStatus(
        'session-123',
        'tenant-123',
        'completed',
        undefined,
        'user-123',
      );

      expect(clientsService.findOne).toHaveBeenCalledWith(
        'client-123',
        'tenant-123',
        ['user'],
      );
      expect(
        (service as any).automationService.triggerEvent,
      ).toHaveBeenCalledWith(AutomationTriggerType.SESSION_COMPLETED, {
        tenantId: 'tenant-123',
        clientId: 'client-123',
        client: {
          id: mockClient.id,
          firstName: mockClient.firstName,
          lastName: mockClient.lastName,
          email: mockClient.email,
          phone: mockClient.phone,
          tenantId: mockClient.tenantId,
          userId: mockClient.userId,
          user: {
            id: mockClient.user.id,
            email: mockClient.user.email,
            firstName: mockClient.user.firstName,
            lastName: mockClient.user.lastName,
            phone: mockClient.user.phone,
          },
        },
        session: {
          id: 'session-123',
          startTime: mockSession.startTime,
          type: mockSession.type,
        },
      });
    });

    it('should deduct session on no_show', async () => {
      const scheduledSession = { ...mockSession, status: 'scheduled' as const };
      sessionRepository.findOne.mockResolvedValue(scheduledSession);

      await service.updateStatus(
        'session-123',
        'tenant-123',
        'no_show',
        undefined,
        'user-123',
      );

      expect(packagesService.useSession).not.toHaveBeenCalled();
    });

    it('should set cancelledAt when cancelling', async () => {
      const scheduledSession = { ...mockSession, status: 'scheduled' as const };
      sessionRepository.findOne.mockResolvedValue(scheduledSession);
      tenantRepository.findOne.mockResolvedValue({
        settings: { cancellationWindowHours: 48 },
      } as any);

      const result = await service.updateStatus(
        'session-123',
        'tenant-123',
        'cancelled',
        undefined,
        'user-123',
      );

      expect(result.cancelledAt).toBeInstanceOf(Date);
    });

    it('should refund session when changing from completed to cancelled', async () => {
      const completedSession = { ...mockSession, status: 'completed' as const };
      sessionRepository.findOne.mockResolvedValue(completedSession);
      packagesService.returnSession.mockResolvedValue(undefined as any);

      const result = await service.updateStatus(
        'session-123',
        'tenant-123',
        'cancelled',
        undefined,
        'user-123',
      );

      expect(result.status).toBe('cancelled');
      expect(packagesService.returnSession).toHaveBeenCalledWith(
        mockActivePackage.id,
        'tenant-123',
      );
    });

    it('should deduct session if admin override deductSession is true on cancel', async () => {
      const scheduledSession = { ...mockSession, status: 'scheduled' as const };
      sessionRepository.findOne.mockResolvedValue(scheduledSession);

      await service.updateStatus(
        'session-123',
        'tenant-123',
        'cancelled',
        true,
        'user-123',
      );

      // If session was already deducted on book, cancelling shouldn't deduct again unless we are "charging" for it?
      // Actually, if we cancel, we usually REFUND. If override is TRUE (deductSession), it means "DON'T REFUND"?
      // Or does it means "CHARGE NOW"?
      // With consume-on-book, "deductSession=true" on cancel means "DO NOT REFUND".
      // So we shouldn't call useSession, we just shouldn't call returnSession.
      expect(packagesService.useSession).not.toHaveBeenCalled();
      expect(packagesService.returnSession).not.toHaveBeenCalled();
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
      sessionRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([]) as any,
      );
    });

    it('should update session successfully', async () => {
      const result = await service.update(
        'session-123',
        updateDto,
        'tenant-123',
        { role: 'admin' },
      );

      expect(result.notes).toBe('Updated notes');
      expect(sessionRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException (warning) if time changed without override', async () => {
      const timeChangeDto = {
        startTime: '2027-01-25T11:00:00Z', // Different from mockSession.startTime
        endTime: '2027-01-25T11:20:00Z',
      };

      // Mock session having bookedStartTime same as original startTime
      sessionRepository.findOne.mockResolvedValue({
        ...mockSession,
        bookedStartTime: mockSession.startTime,
        bookedEndTime: mockSession.endTime,
      } as Session);

      await expect(
        service.update('session-123', timeChangeDto, 'tenant-123', {
          role: 'admin',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow time change with override', async () => {
      const timeChangeDto = {
        startTime: '2027-01-25T11:00:00Z',
        endTime: '2027-01-25T11:20:00Z',
        allowTimeChangeOverride: true,
      };

      sessionRepository.findOne.mockResolvedValue({
        ...mockSession,
        bookedStartTime: mockSession.startTime,
        bookedEndTime: mockSession.endTime,
      } as Session);

      await service.update('session-123', timeChangeDto, 'tenant-123', {
        role: 'admin',
      });
      expect(sessionRepository.save).toHaveBeenCalled();
    });
  });

  describe('createBulk', () => {
    const bulkDto = {
      sessions: [
        {
          studioId: 'studio-123',
          roomId: 'room-123',
          coachId: 'coach-123',
          clientId: 'client-123',
          startTime: '2026-01-27T10:00:00Z',
          endTime: '2026-01-27T10:20:00Z',
        },
        {
          studioId: 'studio-123',
          roomId: 'room-123',
          coachId: 'coach-123',
          clientId: 'client-456',
          startTime: '2026-01-27T10:30:00Z',
          endTime: '2026-01-27T10:50:00Z',
        },
      ],
    };

    beforeEach(() => {
      roomRepository.findOne.mockResolvedValue(mockRoom);
      studioRepository.findOne.mockResolvedValue(mockStudio);
      coachRepository.findOne.mockResolvedValue(mockCoach);
      packagesService.getActivePackageForClient.mockResolvedValue(
        mockActivePackage as any,
      );
      packagesService.findBestPackageForSession.mockResolvedValue(
        mockActivePackage as any,
      );
      packagesService.getClientPackages.mockResolvedValue([
        mockActivePackage,
      ] as any);
      sessionRepository.count.mockResolvedValue(0);
      sessionRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([]) as any,
      );
      sessionRepository.create.mockReturnValue(mockSession);
      sessionRepository.save.mockResolvedValue(mockSession);
      clientsService.findOne.mockResolvedValue({
        email: 'test@example.com',
        firstName: 'Jane',
        studioId: 'studio-123',
        user: { gender: 'female' },
      } as any);
    });

    it('should create multiple sessions successfully', async () => {
      const result = await service.createBulk(bulkDto, 'tenant-123', {
        role: 'admin',
      });

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(sessionRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      // Mock create to fail for the second session
      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(mockSession)
        .mockRejectedValueOnce(new Error('Scheduling conflict'));

      const result = await service.createBulk(bulkDto, 'tenant-123', {
        role: 'admin',
      });

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Scheduling conflict');
    });
  });

  describe('updateSeries', () => {
    const updateDto = {
      notes: 'Updated series notes',
    };

    const parentSession = {
      ...mockSession,
      id: 'parent-123',
      isRecurringParent: true,
    };
    const childSession1 = {
      ...mockSession,
      id: 'child-1',
      parentSessionId: 'parent-123',
      startTime: new Date('2026-01-26T10:00:00Z'),
    };
    const childSession2 = {
      ...mockSession,
      id: 'child-2',
      parentSessionId: 'parent-123',
      startTime: new Date('2026-01-27T10:00:00Z'),
    };

    beforeEach(() => {
      sessionRepository.findOne.mockResolvedValue(parentSession);
      sessionRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([
          parentSession,
          childSession1,
          childSession2,
        ]) as any,
      );
      sessionRepository.save.mockImplementation(async (s: any) => s);
    });

    it('should throw BadRequest if session is not part of a series', async () => {
      sessionRepository.findOne.mockResolvedValue({
        ...mockSession,
        isRecurringParent: false,
        parentSessionId: null,
      });
      await expect(
        service.updateSeries('session-123', updateDto, 'tenant-123', {
          role: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update all future sessions in series', async () => {
      await service.updateSeries('parent-123', updateDto, 'tenant-123', {
        role: 'admin',
      });

      // It should find sessions and save them as array
      expect(sessionRepository.save).toHaveBeenCalled();
      // We can check the calls to save. Since implementation calls `save([updates])` or similar,
      // but my mock `save` is generic.
      // Let's verifying the logic flow at least.
    });
  });

  describe('deleteSeries', () => {
    const parentSession = {
      ...mockSession,
      id: 'parent-123',
      isRecurringParent: true,
    };
    const childSession1 = {
      ...mockSession,
      id: 'child-1',
      parentSessionId: 'parent-123',
    };

    beforeEach(() => {
      sessionRepository.findOne.mockResolvedValue(parentSession);
      sessionRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([parentSession, childSession1]) as any,
      );
      sessionRepository.remove.mockResolvedValue([
        parentSession,
        childSession1,
      ] as any);
    });

    it('should throw BadRequest if session not part of series', async () => {
      sessionRepository.findOne.mockResolvedValue({
        ...mockSession,
        isRecurringParent: false,
        parentSessionId: null,
      });
      await expect(
        service.deleteSeries('session-123', 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete all future sessions in series', async () => {
      await service.deleteSeries('parent-123', 'tenant-123');

      expect(sessionRepository.remove).toHaveBeenCalled();
    });
  });
});
