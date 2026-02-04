import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';
import { Role } from '../src/modules/auth/entities/role.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { UserRoleAssignment } from '../src/modules/auth/entities/user-role.entity';
import { Permission } from '../src/modules/auth/entities/permission.entity';
import { Tenant } from '../src/modules/tenants/entities/tenant.entity';
import { FeatureFlag } from '../src/modules/owner/entities/feature-flag.entity';
import { Plan } from '../src/modules/owner/entities/plan.entity';
import { PermissionService } from '../src/modules/auth/services/permission.service';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('Owner Portal (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let ownerToken: string;
    let supportToken: string;
    let tenantOwnerToken: string;
    let sysTenantId: string;
    let testTenantId: string;

    const ownerEmail = 'platform@ems-studio.com';
    const supportEmail = 'support@ems-studio.com';
    const password = 'SecurePassword123!';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);

        // --- SEEDING ---
        // 1. Create Permissions
        const permRepo = dataSource.getRepository(Permission);
        const permissions = await permRepo.save([
            { key: 'owner.tenant.list', name: 'List Tenants', category: 'owner' },
            { key: 'owner.tenant.view', name: 'View Tenant', category: 'owner' },
            { key: 'owner.tenant.suspend', name: 'Suspend Tenant', category: 'owner' },
            { key: 'owner.feature.toggle', name: 'Toggle Features', category: 'owner' },
            { key: 'owner.feature.view', name: 'View Features', category: 'owner' },
            { key: 'owner.upgrade.approve', name: 'Approve Upgrades', category: 'owner' },
        ]);

        // 2. Create Roles
        const roleRepo = dataSource.getRepository(Role);
        const platformRole = await roleRepo.save({
            key: 'platform_owner',
            name: 'Platform Owner',
            isSystemRole: true,
            permissions: permissions,
        });

        const supportRole = await roleRepo.save({
            key: 'support_owner',
            name: 'Support Owner',
            isSystemRole: true,
            permissions: [permissions[0]], // Only list
        });

        // 3. Create Users
        const userRepo = dataSource.getRepository(User);
        // 5. Create a system tenant for platform users
        const tenantRepo = dataSource.getRepository(Tenant);
        const systemTenant = await tenantRepo.save({
            name: 'System',
            slug: 'system',
            status: 'active',
        });
        sysTenantId = systemTenant.id;

        const hashedPassword = await bcrypt.hash(password, 10);

        const ownerUser = await userRepo.save({
            email: ownerEmail,
            passwordHash: hashedPassword,
            firstName: 'Platform',
            lastName: 'Owner',
            active: true,
            role: 'platform_owner',
            tenantId: sysTenantId,
        }) as User;

        const supportUser = await userRepo.save({
            email: supportEmail,
            passwordHash: hashedPassword,
            firstName: 'Support',
            lastName: 'User',
            active: true,
            role: 'owner',
            tenantId: sysTenantId,
        }) as User;

        // 4. Assign Roles
        const assignmentRepo = dataSource.getRepository(UserRoleAssignment);
        await assignmentRepo.save([
            { userId: ownerUser.id, roleId: platformRole.id },
            { userId: supportUser.id, roleId: supportRole.id },
        ]);

        // 6. Create a test tenant
        const tenant = await tenantRepo.save({
            name: 'Target Tenant',
            slug: 'target-tenant',
            status: 'active',
        });
        testTenantId = tenant.id;

        // Login to get tokens
        const ownerLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: ownerEmail, password, tenantId: sysTenantId });
        ownerToken = ownerLogin.body.accessToken;

        const supportLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: supportEmail, password, tenantId: sysTenantId });
        supportToken = supportLogin.body.accessToken;

        // 7. Create a tenant owner for testTenant
        const tenantOwnerEmail = 'owner@test-tenant.com';
        const tenantOwnerUser = await userRepo.save({
            email: tenantOwnerEmail,
            passwordHash: hashedPassword,
            firstName: 'Tenant',
            lastName: 'Owner',
            active: true,
            role: 'owner',
            tenantId: testTenantId,
        }) as User;

        const tenantOwnerLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: tenantOwnerEmail, password, tenantId: testTenantId });
        tenantOwnerToken = tenantOwnerLogin.body.accessToken;
    }, 90000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('Tenant Management', () => {
        it('GET /owner/tenants - should list tenants for platform owner', async () => {
            const res = await request(app.getHttpServer())
                .get('/owner/tenants')
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(res.body.items).toBeDefined();
            expect(res.body.items.length).toBeGreaterThanOrEqual(1);
            expect(res.body.items.find((t: any) => t.id === testTenantId)).toBeDefined();
        });

        it('POST /owner/tenants/:id/suspend - should suspend tenant', async () => {
            await request(app.getHttpServer())
                .post(`/owner/tenants/${testTenantId}/suspend`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ reason: 'Test Suspension' })
                .expect(201); // Post usually returns 201

            const res = await request(app.getHttpServer())
                .get(`/owner/tenants/${testTenantId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(res.body.tenant.status).toBe('suspended');
        });

        it('forbidden actions for support owner', async () => {
            await request(app.getHttpServer())
                .post(`/owner/tenants/${testTenantId}/suspend`)
                .set('Authorization', `Bearer ${supportToken}`)
                .send({ reason: 'Malicious Suspend' })
                .expect(403);
        });
    });

    describe('Feature Flags', () => {
        it('POST /owner/features/:key/tenant/:id - should toggle feature for tenant', async () => {
            const featureKey = 'test.feature';

            // 1. Create the feature flag definition
            await dataSource.getRepository(FeatureFlag).save({
                key: featureKey,
                name: 'Test Feature',
                category: 'core',
                defaultEnabled: false,
            });

            // 2. Enable for tenant
            await request(app.getHttpServer())
                .post(`/owner/features/${featureKey}/tenant/${testTenantId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ enabled: true, notes: 'Test override' })
                .expect(201);

            // 3. Verify
            const res = await request(app.getHttpServer())
                .get(`/owner/features/tenant/${testTenantId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            const item = res.body.find((f: any) => f.feature.key === featureKey);
            expect(item).toBeDefined();
            expect(item.enabled).toBe(true);
        });
    });

    describe('Plan Limits & Usage', () => {
        it('should block client creation when limit is exceeded (402)', async () => {
            // 1. Create a restricted plan
            const planRepo = dataSource.getRepository(Plan);
            const restrictedPlan = await planRepo.save({
                key: 'restricted',
                name: 'Restricted Plan',
                description: 'Plan with tiny limits',
                limits: {
                    maxClients: 1,
                    maxCoaches: 5,
                    maxSessionsPerMonth: 300,
                    smsAllowance: 200,
                    emailAllowance: 2000,
                    storageGB: 20,
                },
                isActive: true,
                features: [],
            });

            // 2. Assign plan to test tenant
            await dataSource.getRepository(Tenant).update(sysTenantId, {
                plan: restrictedPlan.key,
            });

            // 3. Create first client (within limit)
            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${ownerToken}`) // Platform owner bypasses tenant check? Wait.
                // Actually, platform owner for a SPECIFIC tenant login has a tenantId.
                .send({
                    firstName: 'First',
                    lastName: 'Client',
                    email: 'client1@test.com',
                    phone: '1234567890',
                })
                .expect(201);

            // 4. Try to create second client (exceeds limit)
            const res = await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    firstName: 'Second',
                    lastName: 'Client',
                    email: 'client2@test.com',
                    phone: '0987654321',
                })
                .expect(HttpStatus.PAYMENT_REQUIRED);

            expect(res.body.error).toBe('Payment Required');
            expect(res.body.details.type).toBe('clients');
        });
    });

    describe('Plan Upgrade Workflow', () => {
        it('should handle full upgrade request workflow', async () => {
            // 0. Create the target plan
            await dataSource.getRepository(Plan).save({
                key: 'pro',
                name: 'Pro Plan',
                description: 'Professional Plan',
                limits: {
                    maxClients: 1000,
                    maxCoaches: 50,
                    maxSessionsPerMonth: 5000,
                    smsAllowance: 2000,
                    emailAllowance: 20000,
                    storageGB: 200,
                },
                isActive: true,
                features: [],
            });

            // 1. Submit request as tenant owner
            const submitRes = await request(app.getHttpServer())
                .post('/tenant/upgrade-requests')
                .set('Authorization', `Bearer ${tenantOwnerToken}`)
                .send({
                    requestedPlan: 'pro',
                    reason: 'Scale up',
                })
                .expect(201);

            const requestId = submitRes.body.id;

            // 2. List as platform owner
            const listRes = await request(app.getHttpServer())
                .get('/owner/upgrade-requests')
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(listRes.body.find((r: any) => r.id === requestId)).toBeDefined();

            // 3. Approve as platform owner
            await request(app.getHttpServer())
                .post(`/owner/upgrade-requests/${requestId}/approve`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ notes: 'Approved for scale' })
                .expect(201);

            // 4. Verify tenant plan
            const tenantRes = await request(app.getHttpServer())
                .get(`/owner/tenants/${testTenantId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(tenantRes.body.tenant.plan).toBe('pro');
        });
    });
});
