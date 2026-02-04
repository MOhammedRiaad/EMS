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

    beforeEach(async () => {
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
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            orderBy: jest.fn().mockReturnThis(),
                            getCount: jest.fn(),
                            getMany: jest.fn(),
                        })),
                    },
                },
                {
                    provide: getRepositoryToken(Tenant),
                    useValue: { findOne: jest.fn() },
                },
                {
                    provide: PlanService,
                    useValue: {
                        getPlanByKey: jest.fn(),
                        assignPlanToTenant: jest.fn(),
                    },
                },
                {
                    provide: UsageTrackingService,
                    useValue: { clearBlockStatus: jest.fn() },
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

            await expect(service.submitUpgradeRequest('t1', 'u1', 'pro'))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('approveRequest', () => {
        it('should update tenant plan and clear blocks', async () => {
            requestRepo.findOne.mockResolvedValue({ ...mockRequest, tenant: mockTenant } as any);
            requestRepo.save.mockImplementation(async (r) => r as PlanUpgradeRequest);

            const result = await service.approveRequest('req-1', 'owner-1', 'Approved');

            expect(planService.assignPlanToTenant).toHaveBeenCalledWith('t1', 'pro');
            expect(usageTrackingService.clearBlockStatus).toHaveBeenCalledWith('t1');
            expect(result.status).toBe('approved');
            expect(result.reviewedById).toBe('owner-1');
        });

        it('should throw ConflictException if request is not pending', async () => {
            requestRepo.findOne.mockResolvedValue({ ...mockRequest, status: 'approved' } as any);

            await expect(service.approveRequest('req-1', 'owner-1'))
                .rejects.toThrow(ConflictException);
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
    });
});
