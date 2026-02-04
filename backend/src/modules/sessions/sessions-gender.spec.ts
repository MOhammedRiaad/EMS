
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { CoachTimeOffRequest } from '../coaches/entities/coach-time-off.entity';
import { BadRequestException } from '@nestjs/common';
import { FeatureFlagService } from '../owner/services/feature-flag.service';
import { PermissionService } from '../auth/services/permission.service';
import { RoleService } from '../auth/services/role.service';
import { AuditService } from '../audit/audit.service';

describe('SessionsService - Gender Validation', () => {
    let service: SessionsService;
    let coachRepository: jest.Mocked<Repository<Coach>>;
    let clientsService: jest.Mocked<ClientsService>;
    let sessionRepository: jest.Mocked<Repository<Session>>;

    // Mocks for dependencies irrelevant to gender check but required for service instantiation
    const mockRepo = {
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
    };

    const mockPackagesService = {
        findBestPackageForSession: jest.fn().mockResolvedValue({ id: 'pkg-123' }),
        useSession: jest.fn(),
        returnSession: jest.fn(),
    };

    const mockStudio = {
        id: 'studio-123',
        tenantId: 'tenant-123',
        active: true, // Studio must be active
        openingHours: {}, // No hours = open 24/7 or logic skipped
    };

    const mockRoom = {
        id: 'room-123',
        tenantId: 'tenant-123',
        active: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionsService,
                { provide: getRepositoryToken(Session), useValue: mockRepo },
                { provide: getRepositoryToken(Room), useValue: { ...mockRepo, findOne: jest.fn().mockResolvedValue(mockRoom) } },
                { provide: getRepositoryToken(Studio), useValue: { ...mockRepo, findOne: jest.fn().mockResolvedValue(mockStudio) } },
                { provide: getRepositoryToken(Coach), useValue: mockRepo },
                { provide: getRepositoryToken(Tenant), useValue: mockRepo },
                { provide: getRepositoryToken(CoachTimeOffRequest), useValue: mockRepo },
                { provide: MailerService, useValue: { sendMail: jest.fn() } },
                { provide: ClientsService, useValue: { findOne: jest.fn() } },
                { provide: PackagesService, useValue: mockPackagesService },
                { provide: GamificationService, useValue: { checkAndUnlockAchievements: jest.fn() } },
                {
                    provide: AuditService,
                    useValue: { log: jest.fn(), calculateDiff: jest.fn().mockReturnValue({ changes: {} }) },
                },
                {
                    provide: FeatureFlagService,
                    useValue: { isFeatureEnabled: jest.fn().mockResolvedValue(true) },
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
                        getRoleByKey: jest.fn().mockResolvedValue(null),
                    },
                },
            ],
        }).compile();

        service = module.get<SessionsService>(SessionsService);
        coachRepository = module.get(getRepositoryToken(Coach));
        clientsService = module.get(ClientsService);
        sessionRepository = module.get(getRepositoryToken(Session));

        const mockedSession = {
            id: 'session-123',
            startTime: new Date(),
            endTime: new Date(),
            coachId: 'coach-123',
        } as any;

        (sessionRepository.create as jest.Mock).mockReturnValue(mockedSession);
        (sessionRepository.save as jest.Mock).mockImplementation(async (s) => s || mockedSession);
    });

    const createDto = {
        studioId: 'studio-123',
        roomId: 'room-123',
        coachId: 'coach-123',
        clientId: 'client-123',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 mins later
    };

    it('should allow booking if coach preference is "any"', async () => {
        coachRepository.findOne.mockResolvedValue({
            id: 'coach-123',
            studioId: 'studio-123',
            preferredClientGender: 'any',
        } as any);

        clientsService.findOne.mockResolvedValue({
            id: 'client-123',
            studioId: 'studio-123',
            user: { gender: 'female' },
        } as any);

        await expect(service.create(createDto, 'tenant-123')).resolves.toBeDefined();
    });

    it('should allow booking if gender matches preference', async () => {
        coachRepository.findOne.mockResolvedValue({
            id: 'coach-123',
            studioId: 'studio-123',
            preferredClientGender: 'female',
        } as any);

        clientsService.findOne.mockResolvedValue({
            id: 'client-123',
            studioId: 'studio-123',
            user: { gender: 'female' },
        } as any);

        await expect(service.create(createDto, 'tenant-123')).resolves.toBeDefined();
    });

    it('should THROW if gender does NOT match preference', async () => {
        coachRepository.findOne.mockResolvedValue({
            id: 'coach-123',
            studioId: 'studio-123',
            preferredClientGender: 'female',
        } as any);

        clientsService.findOne.mockResolvedValue({
            id: 'client-123',
            studioId: 'studio-123',
            user: { gender: 'male' },
        } as any);

        await expect(service.create(createDto, 'tenant-123'))
            .rejects.toThrow(BadRequestException);
    });

    it('should REJECT booking if client gender is "prefer_not_to_say" and coach has specific preference', async () => {
        coachRepository.findOne.mockResolvedValue({
            id: 'coach-123',
            studioId: 'studio-123',
            preferredClientGender: 'female',
        } as any);

        clientsService.findOne.mockResolvedValue({
            id: 'client-123',
            studioId: 'studio-123',
            user: { gender: 'prefer_not_to_say' },
        } as any);

        await expect(service.create(createDto, 'tenant-123'))
            .rejects.toThrow(BadRequestException);
    });

    it('should ALLOW booking if client gender is "undefined" (fallback)', async () => {
        // If gender is missing, we shouldn't block?
        coachRepository.findOne.mockResolvedValue({
            id: 'coach-123',
            studioId: 'studio-123',
            preferredClientGender: 'female',
        } as any);

        clientsService.findOne.mockResolvedValue({
            id: 'client-123',
            studioId: 'studio-123',
            user: { gender: null },
        } as any);

        await expect(service.create(createDto, 'tenant-123')).resolves.toBeDefined();
    });

});
