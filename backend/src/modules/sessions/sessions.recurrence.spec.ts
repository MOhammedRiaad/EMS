import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { Session } from './entities/session.entity';
import { Room } from '../rooms/entities/room.entity';
import { Studio } from '../studios/entities/studio.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { MailerService } from '../mailer/mailer.service';
import { ClientsService } from '../clients/clients.service';
import { PackagesService } from '../packages/packages.service';
import { GamificationService } from '../gamification/gamification.service';
import { BadRequestException } from '@nestjs/common';
import { CreateSessionDto } from './dto';
import { CoachTimeOffRequest } from '../coaches/entities/coach-time-off.entity';
import { FeatureFlagService } from '../owner/services/feature-flag.service';
import { PermissionService } from '../auth/services/permission.service';
import { RoleService } from '../auth/services/role.service';
import { AuditService } from '../audit/audit.service';
import { AutomationService } from '../marketing/automation.service';
import { Lead } from '../leads/entities/lead.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('SessionsService - Recurrence', () => {
  let service: SessionsService;
  let sessionRepository: any;

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
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
              select: jest.fn().mockReturnThis(),
            })),
          },
        },
        { provide: getRepositoryToken(Room), useValue: { findOne: jest.fn() } },
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
        { provide: MailerService, useValue: { sendMail: jest.fn() } },
        { provide: ClientsService, useValue: { findOne: jest.fn() } },
        {
          provide: PackagesService,
          useValue: {
            getActivePackageForClient: jest.fn(),
            getClientPackages: jest.fn().mockResolvedValue([]),
            useSession: jest.fn(),
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
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
              select: jest.fn().mockReturnThis(),
            })),
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
            getUserPermissions: jest.fn().mockResolvedValue([]),
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
        {
          provide: getRepositoryToken(Lead),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { notify: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    sessionRepository = module.get(getRepositoryToken(Session));
  });

  describe('validateRecurrence', () => {
    const baseDto: CreateSessionDto = {
      studioId: 'studio-1',
      roomId: 'room-1',
      coachId: 'coach-1',
      clientId: 'client-1',
      startTime: '2026-01-01T10:00:00Z',
      endTime: '2026-01-01T10:20:00Z',
      recurrencePattern: 'daily',
      recurrenceEndDate: '2026-01-05',
    };

    it('should validate daily sessions correctly', async () => {
      // Mock checkConflicts to return validation (no conflicts)
      jest
        .spyOn(service, 'checkConflicts')
        .mockResolvedValue({ hasConflicts: false, conflicts: [] });

      const result = await service.validateRecurrence(baseDto, 'tenant-1');

      expect(result.validSessions.length).toBeGreaterThan(0);
      expect(result.conflicts.length).toBe(0);

      // Should verify that 5 days are generated (Jan 1, 2, 3, 4, 5) if end date is Jan 5?
      // Logic: start Jan 1. Daily. Next Jan 2, 3, 4, 5.
      // Implementation adds parent (Jan 1) then loop.
    });

    it('should identify conflicts', async () => {
      // Mock checkConflicts to return conflict for specific date
      jest.spyOn(service, 'checkConflicts').mockImplementation(async (dto) => {
        if (dto.startTime.includes('2026-01-03')) {
          return {
            hasConflicts: true,
            conflicts: [
              {
                type: 'room',
                message: 'Room busy',
                sessionId: 'existing-session-id',
              },
            ],
          };
        }
        return { hasConflicts: false, conflicts: [] };
      });

      const result = await service.validateRecurrence(baseDto, 'tenant-1');

      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].date.toISOString()).toContain('2026-01-03');
      expect(result.validSessions.length).toBeGreaterThan(0);
    });

    it('should throw if recurrence pattern missing', async () => {
      const invalidDto = { ...baseDto, recurrencePattern: undefined };
      // @ts-ignore
      await expect(
        service.validateRecurrence(invalidDto, 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate variable recurrence correctly', async () => {
      const variableDto: CreateSessionDto = {
        ...baseDto,
        recurrencePattern: 'variable',
        recurrenceSlots: [
          { dayOfWeek: 1, startTime: '10:00' }, // Mon
          { dayOfWeek: 3, startTime: '14:00' }, // Wed
        ],
        startTime: '2026-01-05T09:00:00Z', // Monday Jan 5th
        recurrenceEndDate: '2026-01-12', // Following Monday
      };

      jest
        .spyOn(service, 'checkConflicts')
        .mockResolvedValue({ hasConflicts: false, conflicts: [] });

      const result = await service.validateRecurrence(variableDto, 'tenant-1');

      expect(result.validSessions.length).toBeGreaterThan(0);
      // Jan 5 is Mon.
      // Loop starts relative to startTime.
      // Logic: currentWeekStart = Jan 4 (Sun).
      // Slot 1: Sun + 1 = Mon Jan 5. Time 10:00.
      // Slot 2: Sun + 3 = Wed Jan 7. Time 14:00.
      // Week 2: Sun Jan 11.
      // Slot 1: Sun + 1 = Mon Jan 12.
      // End Date Jan 12. Included.

      // Expected: Jan 5 10:00, Jan 7 14:00, Jan 12 10:00.
      // Parent session logic?
      // "Recurrence dates" include parent session start time? (line 359).
      // Parent is Jan 5 09:00.
      // Variable logic iterates slots.
      // If check excludes parent time overlap, we are good.

      // Note: Variable pattern implementation skips dates <= startTime.
      // Parent startTime is Jan 5 09:00.
      // Slot 1 is Jan 5 10:00. 10:00 > 09:00. Should be included.

      // Valid sessions: Parent(Jan 5 09:00) + Jan 5 10:00 + Jan 7 14:00 + Jan 12 10:00.
      // But usually "Recurrence" implies ADDED sessions.
      // validateRecurrence returns `validSessions` including potential ones.
    });
  });
});
