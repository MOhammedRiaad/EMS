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

        // Silencing logger for tests
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
});
