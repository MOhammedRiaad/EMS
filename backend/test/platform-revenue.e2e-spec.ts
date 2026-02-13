import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';
import { Role } from '../src/modules/auth/entities/role.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { UserRoleAssignment } from '../src/modules/auth/entities/user-role.entity';
import { Permission } from '../src/modules/auth/entities/permission.entity';
import { Tenant } from '../src/modules/tenants/entities/tenant.entity';
import { RevenueType } from '../src/modules/owner/entities/platform-revenue.entity';
import * as bcrypt from 'bcrypt';

describe('Platform Revenue API (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let ownerToken: string;
    let sysTenantId: string;
    let testTenantId: string;

    const ownerEmail = 'revenue-owner@ems-studio.com';
    const password = 'SecurePassword123!';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);

        // --- SEEDING ---
        const permRepo = dataSource.getRepository(Permission);
        const permissions = await permRepo.save([
            { key: 'owner.revenue.create', name: 'Create Revenue', category: 'owner' },
            { key: 'owner.revenue.view', name: 'View Revenue', category: 'owner' },
        ]);

        const roleRepo = dataSource.getRepository(Role);
        const platformRole = await roleRepo.save({
            key: 'revenue_platform_owner',
            name: 'Revenue Platform Owner',
            isSystemRole: true,
            permissions: permissions,
        });

        const tenantRepo = dataSource.getRepository(Tenant);
        const systemTenant = await tenantRepo.save({
            name: 'System',
            slug: 'rev-system',
            status: 'active',
        });
        sysTenantId = systemTenant.id;

        const tenant = await tenantRepo.save({
            name: 'Rev Test Tenant',
            slug: 'rev-test-tenant',
            status: 'active',
        });
        testTenantId = tenant.id;

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRepo = dataSource.getRepository(User);
        const ownerUser = await userRepo.save({
            email: ownerEmail,
            passwordHash: hashedPassword,
            firstName: 'Revenue',
            lastName: 'Owner',
            active: true,
            role: 'platform_owner',
            tenantId: sysTenantId,
        });

        const assignmentRepo = dataSource.getRepository(UserRoleAssignment);
        await assignmentRepo.save({
            userId: ownerUser.id,
            roleId: platformRole.id,
        });

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: ownerEmail, password, tenantId: sysTenantId });

        ownerToken = loginRes.body.accessToken;
    }, 90000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('POST /owner/revenue - should record platform revenue', async () => {
        const res = await request(app.getHttpServer())
            .post('/owner/revenue')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                tenantId: testTenantId,
                amount: 49.99,
                type: RevenueType.SUBSCRIPTION,
                notes: 'Test SaaS Fee',
            })
            .expect(HttpStatus.CREATED);

        expect(Number(res.body.amount)).toBe(49.99);
        expect(res.body.tenant.id).toBe(testTenantId);
    });

    it('GET /owner/revenue - should list revenue records', async () => {
        const res = await request(app.getHttpServer())
            .get('/owner/revenue')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(HttpStatus.OK);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /owner/revenue/stats - should get revenue statistics', async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = now.toISOString();

        const res = await request(app.getHttpServer())
            .get(`/owner/revenue/stats?startDate=${start}&endDate=${end}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(HttpStatus.OK);

        expect(res.body.totalRevenue).toBeDefined();
        expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
});
