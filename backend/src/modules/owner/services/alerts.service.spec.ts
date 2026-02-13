import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AlertsService } from './alerts.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { OwnerService } from './owner.service';
import { Logger } from '@nestjs/common';

describe('AlertsService', () => {
    let service: AlertsService;
    let tenantRepo: jest.Mocked<Repository<Tenant>>;
    let ownerService: jest.Mocked<OwnerService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AlertsService,
                {
                    provide: getRepositoryToken(Tenant),
                    useValue: {
                        find: jest.fn(),
                    },
                },
                {
                    provide: OwnerService,
                    useValue: {
                        getTenantsApproachingLimits: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AlertsService>(AlertsService);
        tenantRepo = module.get(getRepositoryToken(Tenant));
        ownerService = module.get(OwnerService);

        // Silencing logger for tests but allowing inspection
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('checkInactiveTenants', () => {
        it('should create an alert for inactive tenants', async () => {
            const inactiveDate = new Date();
            inactiveDate.setDate(inactiveDate.getDate() - 20);

            const mockInactiveTenants = [
                { id: 't1', name: 'Tenant 1', lastActivityAt: inactiveDate } as Tenant,
            ];

            tenantRepo.find.mockResolvedValue(mockInactiveTenants);

            await service.checkInactiveTenants();

            const alerts = service.getAlerts();
            expect(alerts).toHaveLength(1);
            expect(alerts[0].type).toBe('inactive_tenant');
            expect(alerts[0].tenantId).toBe('t1');
        });

        it('should not create duplicate alerts within 7 days', async () => {
            const inactiveDate = new Date();
            inactiveDate.setDate(inactiveDate.getDate() - 20);

            const mockInactiveTenants = [
                { id: 't1', name: 'Tenant 1', lastActivityAt: inactiveDate } as Tenant,
            ];

            tenantRepo.find.mockResolvedValue(mockInactiveTenants);

            // Run twice
            await service.checkInactiveTenants();
            await service.checkInactiveTenants();

            const alerts = service.getAlerts();
            expect(alerts).toHaveLength(1); // Still only 1
        });
    });

    describe('checkSubscriptionExpirations', () => {
        it('should create critical alert for expired subscriptions', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1);

            const activeTenants = [
                { id: 't1', name: 'Expired Tenant', status: 'active', subscriptionEndsAt: expiredDate } as Tenant,
            ];

            tenantRepo.find.mockResolvedValue(activeTenants);

            await service.checkSubscriptionExpirations();

            const alerts = service.getAlerts({ severity: 'critical' });
            expect(alerts).toHaveLength(1);
            expect(alerts[0].type).toBe('subscription_expired');
            expect(alerts[0].tenantName).toBe('Expired Tenant');
        });

        it('should create warning alert for subscriptions expiring within 7 days', async () => {
            const expiringSoonDate = new Date();
            expiringSoonDate.setDate(expiringSoonDate.getDate() + 3);

            const activeTenants = [
                { id: 't2', name: 'Expiring Soon', status: 'active', subscriptionEndsAt: expiringSoonDate } as Tenant,
            ];

            tenantRepo.find.mockResolvedValue(activeTenants);

            await service.checkSubscriptionExpirations();

            const alerts = service.getAlerts({ severity: 'warning' });
            expect(alerts).toHaveLength(1);
            expect(alerts[0].type).toBe('subscription_expiring');
            expect(alerts[0].data?.daysLeft).toBe(3);
        });

        it('should not create alerts for subscriptions far in the future', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);

            const activeTenants = [
                { id: 't3', name: 'Healthy Tenant', status: 'active', subscriptionEndsAt: futureDate } as Tenant,
            ];

            tenantRepo.find.mockResolvedValue(activeTenants);

            await service.checkSubscriptionExpirations();

            const alerts = service.getAlerts();
            expect(alerts).toHaveLength(0);
        });

        it('should prevent duplicate expiration alerts within 7 days', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1);

            const activeTenants = [
                { id: 't1', name: 'Expired Tenant', status: 'active', subscriptionEndsAt: expiredDate } as Tenant,
            ];

            tenantRepo.find.mockResolvedValue(activeTenants);

            await service.checkSubscriptionExpirations();
            await service.checkSubscriptionExpirations();

            const alerts = service.getAlerts();
            expect(alerts).toHaveLength(1);
        });
    });

    describe('acknowledgeAlerts', () => {
        it('should acknowledge multiple matching alerts', () => {
            service.createAlert('type1', 'warning', 'usage', 'Title 1', 'Message 1', 't1');
            service.createAlert('type2', 'critical', 'billing', 'Title 2', 'Message 2', 't1');
            service.createAlert('type3', 'warning', 'usage', 'Title 3', 'Message 3', 't2');

            const count = service.acknowledgeAlerts({ tenantId: 't1' }, 'user-1');
            expect(count).toBe(2);

            const t1Alerts = service.getAlerts({ tenantId: 't1', acknowledged: true });
            expect(t1Alerts).toHaveLength(2);

            const t2Alerts = service.getAlerts({ tenantId: 't2', acknowledged: false });
            expect(t2Alerts).toHaveLength(1);
        });
    });

    describe('getAlertCounts', () => {
        it('should return correct counts of unacknowledged alerts', () => {
            service.createAlert('type1', 'critical', 'usage', 'T1', 'M1');
            service.createAlert('type2', 'warning', 'billing', 'T2', 'M2');
            service.createAlert('type3', 'info', 'system', 'T3', 'M3');

            const counts = service.getAlertCounts();
            expect(counts.critical).toBe(1);
            expect(counts.warning).toBe(1);
            expect(counts.info).toBe(1);
            expect(counts.total).toBe(3);

            service.acknowledgeAlert(service.getAlerts()[0].id, 'u1');
            const newCounts = service.getAlertCounts();
            expect(newCounts.total).toBe(2);
        });
    });

    describe('cleanupOldAlerts', () => {
        it('should remove acknowledged alerts older than 30 days', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);

            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 5);

            // Create alerts and manipulate their createdAt
            const a1 = service.createAlert('t1', 'info', 'system', 'Old Ack', 'M1');
            a1.acknowledged = true;
            a1.createdAt = oldDate;

            const a2 = service.createAlert('t2', 'info', 'system', 'Old Unack', 'M2');
            a2.acknowledged = false;
            a2.createdAt = oldDate;

            const a3 = service.createAlert('t3', 'info', 'system', 'Recent Ack', 'M3');
            a3.acknowledged = true;
            a3.createdAt = recentDate;

            await service.cleanupOldAlerts();

            const allAlerts = service.getAlerts();
            expect(allAlerts).toHaveLength(2);
            expect(allAlerts.find(a => a.title === 'Old Ack')).toBeUndefined();
            expect(allAlerts.find(a => a.title === 'Old Unack')).toBeDefined();
            expect(allAlerts.find(a => a.title === 'Recent Ack')).toBeDefined();
        });
    });

    describe('checkUsageThresholds', () => {
        it('should NOT create usage alerts for tenants below 80% threshold', async () => {
            // Setup: OwnerService returning a tenant at 50% usage
            ownerService.getTenantsApproachingLimits.mockResolvedValue([
                {
                    tenant: { id: 't1', name: 'Tenant 1' } as Tenant,
                    limitType: 'clients',
                    percentage: 50,
                },
            ]);

            await service.checkUsageThresholds();

            // AlertsService only creates alerts for >= 90% (warning) or >= 100% (critical)
            const alerts = service.getAlerts({ category: 'usage' });
            expect(alerts.filter(a => a.type === 'usage_approaching_limit')).toHaveLength(0);
        });

        it('should create critical alert if usage is >= 100%', async () => {
            ownerService.getTenantsApproachingLimits.mockResolvedValue([
                {
                    tenant: { id: 't2', name: 'Tenant 2' } as Tenant,
                    limitType: 'sessions',
                    percentage: 100,
                },
            ]);

            await service.checkUsageThresholds();

            const alerts = service.getAlerts({ tenantId: 't2' });
            expect(alerts[0].severity).toBe('critical');
            expect(alerts[0].type).toBe('usage_at_limit');
        });

        it('should handle errors gracefully but log them', async () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'error');
            ownerService.getTenantsApproachingLimits.mockRejectedValue(new Error('DB Error'));

            await service.checkUsageThresholds();

            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to check usage thresholds'));
        });
    });
});
