import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoachPortalService } from './coach-portal.service';
import { Session, SessionStatus } from '../sessions/entities/session.entity';
import { Client } from '../clients/entities/client.entity';
import { InBodyScan } from '../inbody-scans/entities/inbody-scan.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('CoachPortalService', () => {
  let service: CoachPortalService;
  let sessionsRepo: jest.Mocked<Repository<Session>>;
  let clientsRepo: jest.Mocked<Repository<Client>>;
  let inBodyScansRepo: jest.Mocked<Repository<InBodyScan>>;
  let coachesRepo: jest.Mocked<Repository<Coach>>;

  const mockCoach = {
    id: 'coach-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    active: true,
    availabilityRules: [{ dayOfWeek: 1, available: true }],
  } as Coach;

  const mockSession = {
    id: 'session-123',
    tenantId: 'tenant-123',
    coachId: 'coach-123',
    clientId: 'client-123',
    status: 'scheduled' as SessionStatus,
    startTime: new Date(),
  } as Session;

  const mockClient = {
    id: 'client-123',
    firstName: 'John',
    lastName: 'Doe',
    tenantId: 'tenant-123',
  } as Client;

  const createMockQueryBuilder = (results: any[] = []) => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachPortalService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InBodyScan),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Coach),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoachPortalService>(CoachPortalService);
    sessionsRepo = module.get(getRepositoryToken(Session));
    clientsRepo = module.get(getRepositoryToken(Client));
    inBodyScansRepo = module.get(getRepositoryToken(InBodyScan));
    coachesRepo = module.get(getRepositoryToken(Coach));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return coach dashboard statistics', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.find.mockResolvedValue([mockSession]);

      const result = await service.getDashboardStats('user-123', 'tenant-123');

      expect(result).toHaveProperty('sessionsCount');
      expect(result.sessionsCount).toBe(1);
    });

    it('should throw UnauthorizedException if user is not a coach', async () => {
      coachesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getDashboardStats('user-123', 'tenant-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getSchedule', () => {
    it('should return coach schedule for day', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.find.mockResolvedValue([mockSession]);

      const result = await service.getSchedule(
        'user-123',
        'tenant-123',
        new Date(),
        'day',
      );

      expect(result).toEqual([mockSession]);
    });

    it('should return schedule for week', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.find.mockResolvedValue([mockSession]);

      const result = await service.getSchedule(
        'user-123',
        'tenant-123',
        new Date(),
        'week',
      );

      expect(sessionsRepo.find).toHaveBeenCalled();
      expect(result).toEqual([mockSession]);
    });

    it('should return future sessions', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.find.mockResolvedValue([mockSession]);

      const result = await service.getSchedule(
        'user-123',
        'tenant-123',
        new Date(),
        'future',
      );

      expect(result).toEqual([mockSession]);
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.findOne.mockResolvedValue(mockSession);
      sessionsRepo.save.mockResolvedValue({
        ...mockSession,
        status: 'completed' as SessionStatus,
      });

      const result = await service.updateSessionStatus(
        'session-123',
        'user-123',
        'tenant-123',
        'completed',
      );

      expect(result.status).toBe('completed');
    });

    it('should throw NotFoundException if session not found', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateSessionStatus(
          'session-123',
          'user-123',
          'tenant-123',
          'completed',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyClients', () => {
    it('should return clients for coach', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      const mockQb = createMockQueryBuilder([mockClient]);
      clientsRepo.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.getMyClients('user-123', 'tenant-123');

      expect(result).toEqual([mockClient]);
    });
  });

  describe('checkClientAccess', () => {
    it('should return true if coach has sessions with client', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.count.mockResolvedValue(5);

      const result = await service.checkClientAccess('user-123', 'client-123');

      expect(result).toBe(true);
    });

    it('should return false if coach has no sessions with client', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      sessionsRepo.count.mockResolvedValue(0);

      const result = await service.checkClientAccess('user-123', 'client-123');

      expect(result).toBe(false);
    });
  });

  describe('getClientDetails', () => {
    it('should return client details with measurements and history', async () => {
      clientsRepo.findOne.mockResolvedValue(mockClient);
      inBodyScansRepo.find.mockResolvedValue([]);
      sessionsRepo.find.mockResolvedValue([]);

      const result = await service.getClientDetails('client-123', 'tenant-123');

      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('history');
    });

    it('should throw NotFoundException if client not found', async () => {
      clientsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getClientDetails('nonexistent', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailability', () => {
    it('should return coach availability rules', async () => {
      coachesRepo.findOne
        .mockResolvedValueOnce(mockCoach)
        .mockResolvedValueOnce(mockCoach);

      const result = await service.getAvailability('user-123');

      expect(result).toEqual(mockCoach.availabilityRules);
    });
  });

  describe('updateAvailability', () => {
    const newRules = [
      { dayOfWeek: 1, available: true, startTime: '09:00', endTime: '17:00' },
    ];

    it('should update coach availability rules', async () => {
      coachesRepo.findOne.mockResolvedValue(mockCoach);
      coachesRepo.save.mockResolvedValue({
        ...mockCoach,
        availabilityRules: newRules,
      });

      const result = await service.updateAvailability('user-123', newRules);

      expect(result.availabilityRules).toEqual(newRules);
    });

    it('should throw NotFoundException if coach not found', async () => {
      coachesRepo.findOne
        .mockResolvedValueOnce(mockCoach)
        .mockResolvedValueOnce(null);

      await expect(
        service.updateAvailability('user-123', newRules),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
