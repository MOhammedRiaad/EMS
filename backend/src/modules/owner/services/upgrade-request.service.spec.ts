import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpgradeRequestService } from './upgrade-request.service';
import { PlanUpgradeRequest } from '../entities/plan-upgrade-request.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { PlanService } from './plan.service';
import { UsageTrackingService } from './usage-tracking.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UpgradeRequestService', () => {
  let service: UpgradeRequestService;
  let requestRepo: jest.Mocked<Repository<PlanUpgradeRequest>>;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;
  let planService: jest.Mocked<PlanService>;
  let usageTrackingService: jest.Mocked<UsageTrackingService>;

  const mockRequest = {
    id: 'req-1',
    tenantId: 't1',
    status: 'pending',
    requestedPlan: 'pro',
  } as PlanUpgradeRequest;

  const mockTenant = { id: 't1', plan: 'basic' } as Tenant;

  const mockUsageTrackingService = { clearBlockStatus: jest.fn() };

  let queryBuilderMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpgradeRequestService,
        {
          provide: getRepositoryToken(PlanUpgradeRequest),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => queryBuilderMock),
          },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: PlanService,
          useValue: {
            getPlanByKey: jest.fn(),
            assignPlanToTenant: jest.fn().mockResolvedValue(mockTenant),
          },
        },
        {
          provide: UsageTrackingService,
          useValue: mockUsageTrackingService,
        },
      ],
    }).compile();

    service = module.get<UpgradeRequestService>(UpgradeRequestService);
    requestRepo = module.get(getRepositoryToken(PlanUpgradeRequest));
    tenantRepo = module.get(getRepositoryToken(Tenant));
    planService = module.get(PlanService);
    usageTrackingService = module.get(UsageTrackingService);
  });

  describe('submitUpgradeRequest', () => {
    it('should create and save a new request', async () => {
      requestRepo.findOne.mockResolvedValue(null);
      tenantRepo.findOne.mockResolvedValue(mockTenant);
      planService.getPlanByKey.mockResolvedValue({ key: 'pro' } as any);
      requestRepo.create.mockReturnValue(mockRequest);
      requestRepo.save.mockResolvedValue(mockRequest);

      const result = await service.submitUpgradeRequest('t1', 'u1', 'pro');

      expect(result).toBe(mockRequest);
      expect(requestRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if a pending request already exists', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.submitUpgradeRequest('t1', 'u1', 'pro'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('approveRequest', () => {
    it('should update tenant plan and clear blocks', async () => {
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        tenant: mockTenant,
      } as any);
      requestRepo.save.mockImplementation(async (r) => r as PlanUpgradeRequest);

      const result = await service.approveRequest(
        'req-1',
        'owner-1',
        'Approved',
      );

      expect(planService.assignPlanToTenant).toHaveBeenCalledWith('t1', 'pro');
      expect(usageTrackingService.clearBlockStatus).toHaveBeenCalledWith('t1');
      expect(result.status).toBe('approved');
      expect(result.reviewedById).toBe('owner-1');
    });

    it('should update subscription end date if provided', async () => {
      const futureDate = new Date('2030-01-01');
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        tenant: mockTenant,
      } as any);
      requestRepo.save.mockImplementation(async (r) => r as PlanUpgradeRequest);

      await service.approveRequest('req-1', 'owner-1', 'Notes', futureDate);

      expect(tenantRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 't1',
        subscriptionEndsAt: futureDate,
      }));
    });

    it('should throw ConflictException if request is not pending', async () => {
      requestRepo.findOne.mockResolvedValue({
        ...mockRequest,
        status: 'approved',
      } as any);

      await expect(service.approveRequest('req-1', 'owner-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if request not found', async () => {
      requestRepo.findOne.mockResolvedValue(null);
      await expect(service.approveRequest('none', 'o1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectRequest', () => {
    it('should mark request as rejected', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest);
      requestRepo.save.mockImplementation(async (r) => r as PlanUpgradeRequest);

      const result = await service.rejectRequest('req-1', 'owner-1', 'Denied');

      expect(result.status).toBe('rejected');
      expect(result.reviewNotes).toBe('Denied');
      expect(planService.assignPlanToTenant).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if request not found', async () => {
      requestRepo.findOne.mockResolvedValue(null);
      await expect(service.rejectRequest('none', 'o1', 'n')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already processed', async () => {
      requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'rejected' } as any);
      await expect(service.rejectRequest('req-1', 'o1', 'n')).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelRequest', () => {
    it('should delete a pending request', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest);
      await service.cancelRequest('req-1', 't1');
      expect(requestRepo.delete).toHaveBeenCalledWith('req-1');
    });

    it('should throw NotFoundException if no pending request found for tenant', async () => {
      requestRepo.findOne.mockResolvedValue(null);
      await expect(service.cancelRequest('req-1', 't1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTenantRequestHistory', () => {
    it('should return history for a tenant', async () => {
      const history = [mockRequest];
      requestRepo.find.mockResolvedValue(history);
      const result = await service.getTenantRequestHistory('t1');
      expect(result).toEqual(history);
      expect(requestRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 't1' } }));
    });
  });

  describe('getRequestsWithFilters', () => {
    it('should apply status and tenant filters', async () => {
      queryBuilderMock.getCount.mockResolvedValue(1);
      queryBuilderMock.getMany.mockResolvedValue([mockRequest]);

      const result = await service.getRequestsWithFilters({
        status: 'pending',
        tenantId: 't1',
        limit: 10,
        offset: 0
      });

      expect(result.total).toBe(1);
      expect(result.requests).toHaveLength(1);
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(expect.stringContaining('status'), expect.any(Object));
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(expect.stringContaining('tenantId'), expect.any(Object));
    });

    it('should work without optional filters', async () => {
      queryBuilderMock.getCount.mockResolvedValue(0);
      queryBuilderMock.getMany.mockResolvedValue([]);

      await service.getRequestsWithFilters({});
      expect(queryBuilderMock.limit).not.toHaveBeenCalled();
    });
  });

  describe('getPendingRequest', () => {
    it('should return pending request if found', async () => {
      requestRepo.findOne.mockResolvedValue(mockRequest);
      const result = await service.getPendingRequest('t1');
      expect(result).toBe(mockRequest);
    });
  });

  describe('getAllPendingRequests', () => {
    it('should return all pending requests', async () => {
      requestRepo.find.mockResolvedValue([mockRequest]);
      const result = await service.getAllPendingRequests();
      expect(result).toHaveLength(1);
      expect(requestRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'pending' } }));
    });
  });
});
