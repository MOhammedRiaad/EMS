import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OwnerService } from './owner.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Client } from '../../clients/entities/client.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { TermsAcceptance } from '../../terms/entities/terms-acceptance.entity';
import { UsageTrackingService } from './usage-tracking.service';
import { FeatureFlagService } from './feature-flag.service';
import { PlanService } from './plan.service';
import { OwnerAuditService } from './owner-audit.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';

describe('OwnerService', () => {
  let service: OwnerService;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let clientRepo: jest.Mocked<Repository<Client>>;
  let coachRepo: jest.Mocked<Repository<Coach>>;
  let sessionRepo: jest.Mocked<Repository<Session>>;
  let auditService: jest.Mocked<OwnerAuditService>;

  const mockTenant = { id: 't1', name: 'Tenant 1', status: 'active' } as Tenant;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getCount: jest.fn(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { count: jest.fn(), findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: { count: jest.fn(), createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: { count: jest.fn(), createQueryBuilder: jest.fn() },
        },
        { provide: getRepositoryToken(Coach), useValue: { count: jest.fn() } },
        {
          provide: getRepositoryToken(TermsAcceptance),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: UsageTrackingService,
          useValue: {
            getUsageSnapshot: jest.fn(),
            getGlobalUsageStats: jest.fn(),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: { getFeaturesForTenant: jest.fn() },
        },
        {
          provide: PlanService,
          useValue: { assignPlanToTenant: jest.fn(), getPlanByKey: jest.fn() },
        },
        {
          provide: OwnerAuditService,
          useValue: { logAction: jest.fn(), countActions: jest.fn() },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OwnerService>(OwnerService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
    userRepo = module.get(getRepositoryToken(User));
    clientRepo = module.get(getRepositoryToken(Client));
    coachRepo = module.get(getRepositoryToken(Coach));
    sessionRepo = module.get(getRepositoryToken(Session));
    auditService = module.get(OwnerAuditService);
  });

  describe('getDashboardStats', () => {
    it('should return aggregated counts from multiple repositories', async () => {
      tenantRepo.count.mockResolvedValue(10);
      clientRepo.count.mockResolvedValue(100);
      coachRepo.count.mockResolvedValue(20);
      sessionRepo.count.mockResolvedValue(50);

      const result = await service.getDashboardStats();

      expect(result.totalTenants).toBe(10);
      expect(result.totalClients).toBe(100);
      expect(tenantRepo.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('suspendTenant', () => {
    it('should update tenant status and log the action', async () => {
      tenantRepo.findOne.mockResolvedValue(mockTenant);
      tenantRepo.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.suspendTenant('t1', 'Violation', 'owner-1');

      expect(result.status).toBe('suspended');
      expect(result.suspendedReason).toBe('Violation');
      expect(auditService.logAction).toHaveBeenCalledWith(
        'owner-1',
        'SUSPEND_TENANT',
        expect.any(Object),
        't1',
        undefined,
      );
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      tenantRepo.findOne.mockResolvedValue(null);

      await expect(service.suspendTenant('m1', 'r', 'o')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reactivateTenant', () => {
    it('should set status back to active', async () => {
      const suspended = { ...mockTenant, status: 'suspended' } as Tenant;
      tenantRepo.findOne.mockResolvedValue(suspended);
      tenantRepo.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.reactivateTenant('t1', 'owner-1');

      expect(result.status).toBe('active');
      expect(result.suspendedAt).toBeNull();
    });
  });

  describe('getComplianceStats', () => {
    it('should calculate consent rates and RTBF stats', async () => {
      clientRepo.count.mockResolvedValueOnce(100); // total
      clientRepo.count.mockResolvedValueOnce(80); // active

      const dataSource = service['dataSource'];
      (dataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ count: '40' }]) // marketing
        .mockResolvedValueOnce([{ count: '60' }]); // data_processing

      const termsRepo = service['termsAcceptanceRepository'];
      (termsRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '40' }),
      });

      auditService.countActions.mockResolvedValue(5);
      userRepo.count.mockResolvedValue(10);

      const result = await service.getComplianceStats();

      expect(result.clients.marketingConsentRate).toBe(50); // 40/80
      expect(result.clients.dataProcessingConsentRate).toBe(75); // 60/80
      expect(result.rightToBeForgotten.anonymizedTenants).toBe(5);
      expect(result.rightToBeForgotten.anonymizedUsersIndividual).toBe(10);
    });
  });

  describe('listTenants', () => {
    it('should return flattened tenant DTOs with plan objects and contact emails', async () => {
      const mockTenants = [
        {
          id: 't1',
          name: 'Tenant 1',
          plan: 'pro',
          usageStats: { clients: 5 },
          createdAt: new Date(),
        },
        {
          id: 't2',
          name: 'Tenant 2',
          plan: 'starter',
          usageStats: null,
          createdAt: new Date(),
        },
      ] as Tenant[];

      const mockOwners = [
        { tenantId: 't1', email: 'owner1@test.com' },
        { tenantId: 't2', email: 'owner2@test.com' },
      ] as User[];

      tenantRepo.createQueryBuilder.mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTenants),
      } as any);

      clientRepo.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ tenantId: 't1', count: '5' }]),
      } as any);

      sessionRepo.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ tenantId: 't1', count: '10' }]),
      } as any);

      userRepo.find.mockResolvedValue(mockOwners);

      const result = await service.listTenants({});

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: 't1',
          plan: { key: 'pro', name: 'Pro' },
          contactEmail: 'owner1@test.com',
          stats: { clients: 5, sessionsThisMonth: 10 },
        }),
      );
      expect(result.items[1].plan).toEqual({ key: 'starter', name: 'Starter' });
      expect(result.items[1].stats).toEqual({
        clients: 0,
        sessionsThisMonth: 0,
      }); // Fallback
    });
  });

  describe('getTenantDetails', () => {
    it('should return flattened detail DTO with plan, owner, and usage info', async () => {
      const mockTenantDetails = {
        id: 't1',
        name: 'Tenant 1',
        plan: 'pro',
      } as Tenant;
      const mockUsage = { clients: { current: 10 } };
      const mockFeatures = [{ key: 'f1', isEnabled: true }];
      const mockOwner = { id: 'u1', email: 'owner@test.com' } as User;
      const mockPlan = { key: 'pro', name: 'Pro Plan', price: 99 } as any;

      tenantRepo.findOne.mockResolvedValue(mockTenantDetails);
      const usageService = service['usageTrackingService'];
      const featureService = service['featureFlagService'];
      const planService = service['planService'];

      (usageService.getUsageSnapshot as jest.Mock).mockResolvedValue(mockUsage);
      (featureService.getFeaturesForTenant as jest.Mock).mockResolvedValue(
        mockFeatures,
      );
      (planService.getPlanByKey as jest.Mock).mockResolvedValue(mockPlan);
      userRepo.findOne.mockResolvedValue(mockOwner);

      const result = await service.getTenantDetails('t1');

      expect(result.id).toBe('t1');
      expect(result.name).toBe('Tenant 1');
      expect(result.contactEmail).toBe('owner@test.com');
      expect(result.plan).toEqual({ key: 'pro', name: 'Pro Plan', price: 99 });
      expect(result.usage).toEqual(mockUsage);
      expect(result.features).toEqual(mockFeatures);
    });

    it('should handle missing plan details gracefully', async () => {
      const mockTenantDetails = {
        id: 't1',
        name: 'Tenant 1',
        plan: 'pro',
      } as Tenant;
      tenantRepo.findOne.mockResolvedValue(mockTenantDetails);
      // ... other mocks ...
      const usageService = service['usageTrackingService'];
      const featureService = service['featureFlagService'];
      const planService = service['planService'];

      (usageService.getUsageSnapshot as jest.Mock).mockResolvedValue({});
      (featureService.getFeaturesForTenant as jest.Mock).mockResolvedValue([]);
      (planService.getPlanByKey as jest.Mock).mockRejectedValue(
        new Error('Not found'),
      );
      userRepo.findOne.mockResolvedValue(null); // No owner found

      const result = await service.getTenantDetails('t1');

      expect(result.plan).toEqual({ key: 'pro', name: 'Pro', price: 0 }); // Fallback
      expect(result.contactEmail).toBe('N/A');
    });
  });

  describe('updateTenantSubscription', () => {
    it('should update the subscription end date and log the action', async () => {
      const newDate = new Date();
      newDate.setFullYear(newDate.getFullYear() + 1);

      tenantRepo.findOne.mockResolvedValue(mockTenant);
      tenantRepo.save.mockImplementation(async (t) => t as Tenant);

      const result = await service.updateTenantSubscription('t1', newDate, 'owner-1');

      expect(result.subscriptionEndsAt).toEqual(newDate);
      expect(auditService.logAction).toHaveBeenCalledWith(
        'owner-1',
        'UPDATE_SUBSCRIPTION',
        expect.objectContaining({ previousEndsAt: undefined, newEndsAt: newDate }),
        't1',
        undefined,
      );
    });

    it('should throw NotFoundException if tenant not found', async () => {
      tenantRepo.findOne.mockResolvedValue(null);
      await expect(service.updateTenantSubscription('t1', new Date(), 'o1')).rejects.toThrow(NotFoundException);
    });
  });
});
