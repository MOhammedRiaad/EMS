import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageTrackingService } from './usage-tracking.service';
import { UsageMetric } from '../entities/usage-metric.entity';
import { Plan } from '../entities/plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Client } from '../../clients/entities/client.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { Session } from '../../sessions/entities/session.entity';
import { ForbiddenException } from '@nestjs/common';

describe('UsageTrackingService', () => {
    let service: UsageTrackingService;
    let metricRepo: jest.Mocked<Repository<UsageMetric>>;
    let planRepo: jest.Mocked<Repository<Plan>>;
    let tenantRepo: jest.Mocked<Repository<Tenant>>;
    let clientRepo: jest.Mocked<Repository<Client>>;
    let coachRepo: jest.Mocked<Repository<Coach>>;
    let sessionRepo: jest.Mocked<Repository<Session>>;

    const mockTenant = { id: 't1', plan: 'basic' } as Tenant;
    const mockPlan = {
        key: 'basic',
        limits: {
            maxClients: 10,
            maxCoaches: 2,
            maxSessionsPerMonth: 50,
            smsAllowance: 100,
            emailAllowance: 1000,
            storageGB: 5,
        },
    } as Plan;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsageTrackingService,
                {
                    provide: getRepositoryToken(UsageMetric),
                    useValue: {
                        findOne: jest.fn(),
                        find: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        createQueryBuilder: jest.fn(() => ({
                            select: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            getRawOne: jest.fn(),
                        })),
                    },
                },
                {
                    provide: getRepositoryToken(Plan),
                    useValue: { findOne: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Tenant),
                    useValue: { findOne: jest.fn(), update: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Client),
                    useValue: { count: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Coach),
                    useValue: { count: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Session),
                    useValue: { count: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<UsageTrackingService>(UsageTrackingService);
        metricRepo = module.get(getRepositoryToken(UsageMetric));
        planRepo = module.get(getRepositoryToken(Plan));
        tenantRepo = module.get(getRepositoryToken(Tenant));
        clientRepo = module.get(getRepositoryToken(Client));
        coachRepo = module.get(getRepositoryToken(Coach));
        sessionRepo = module.get(getRepositoryToken(Session));
    });

    describe('getUsageSnapshot', () => {
        it('should correctly aggregate usage and calculate percentages', async () => {
            tenantRepo.findOne.mockResolvedValue(mockTenant);
            planRepo.findOne.mockResolvedValue(mockPlan);
            clientRepo.count.mockResolvedValue(5); // 50%
            coachRepo.count.mockResolvedValue(1); // 50%
            sessionRepo.count.mockResolvedValue(25); // 50%

            // Mocking helper methods called by getUsageSnapshot
            jest.spyOn(service as any, 'getMonthlyMetric').mockResolvedValue(10);
            jest.spyOn(service as any, 'getLatestMetric').mockResolvedValue(0);

            const result = await service.getUsageSnapshot('t1');

            expect(result.clients).toEqual({ current: 5, limit: 10, percentage: 50 });
            expect(result.coaches).toEqual({ current: 1, limit: 2, percentage: 50 });
            expect(result.sessionsThisMonth.percentage).toBe(50);
        });
    });

    describe('checkLimit', () => {
        it('should return violation if limit is reached', async () => {
            const fullSnapshot = {
                clients: { current: 10, limit: 10, percentage: 100 },
                coaches: { current: 1, limit: 2, percentage: 50 },
                sessionsThisMonth: { current: 0, limit: 50, percentage: 0 },
                smsThisMonth: { current: 0, limit: 100, percentage: 0 },
                emailThisMonth: { current: 0, limit: 1000, percentage: 0 },
                storageGB: { current: 0, limit: 5, percentage: 0 },
            };
            jest.spyOn(service, 'getUsageSnapshot').mockResolvedValue(fullSnapshot as any);
            tenantRepo.findOne.mockResolvedValue(mockTenant);

            const result = await service.checkLimit('t1', 'clients');

            expect(result).toBeDefined();
            expect(result?.type).toBe('clients');
            expect(result?.message).toContain('Client limit reached');
        });

        it('should return null if limit is not reached', async () => {
            const safeSnapshot = {
                clients: { current: 5, limit: 10, percentage: 50 },
                coaches: { current: 1, limit: 2, percentage: 50 },
                sessionsThisMonth: { current: 0, limit: 50, percentage: 0 },
                smsThisMonth: { current: 0, limit: 100, percentage: 0 },
                emailThisMonth: { current: 0, limit: 1000, percentage: 0 },
                storageGB: { current: 0, limit: 5, percentage: 0 },
            };
            jest.spyOn(service, 'getUsageSnapshot').mockResolvedValue(safeSnapshot as any);
            tenantRepo.findOne.mockResolvedValue(mockTenant);

            const result = await service.checkLimit('t1', 'clients');

            expect(result).toBeNull();
        });
    });

    describe('enforceLimit', () => {
        it('should throw ForbiddenException (402) and block tenant if limit exceeded', async () => {
            const violation = { type: 'clients', current: 10, limit: 10, message: 'Full', plan: 'basic' };
            jest.spyOn(service, 'checkLimit').mockResolvedValue(violation);

            try {
                await service.enforceLimit('t1', 'clients');
                fail('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(ForbiddenException);
                expect((e as any).response.statusCode).toBe(402);
                expect(tenantRepo.update).toHaveBeenCalledWith('t1', {
                    isBlocked: true,
                    blockReason: expect.stringContaining('clients limit exceeded'),
                });
            }
        });

        it('should not throw if limit is not exceeded', async () => {
            jest.spyOn(service, 'checkLimit').mockResolvedValue(null);
            await expect(service.enforceLimit('t1', 'clients')).resolves.not.toThrow();
        });
    });

    describe('recordMetric', () => {
        it('should update existing metric if found for today', async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existing = { value: 5, metadata: {} } as UsageMetric;
            metricRepo.findOne.mockResolvedValue(existing);
            metricRepo.save.mockImplementation(async (m) => m as UsageMetric);

            const result = await service.recordMetric('t1', 'sms', 2, 'daily', { to: '123' });

            expect(existing.value).toBe(7);
            expect(existing.metadata).toEqual({ to: '123' });
            expect(metricRepo.save).toHaveBeenCalledWith(existing);
        });

        it('should create new metric if not found for today', async () => {
            metricRepo.findOne.mockResolvedValue(null);
            const newMetric = { value: 1 } as UsageMetric;
            metricRepo.create.mockReturnValue(newMetric);
            metricRepo.save.mockResolvedValue(newMetric);

            await service.recordMetric('t1', 'sms', 1);

            expect(metricRepo.create).toHaveBeenCalled();
            expect(metricRepo.save).toHaveBeenCalled();
        });
    });
});
