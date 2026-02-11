import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';

describe('AuditModule (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // 1. Register Tenant Owner
    const email = `audit-owner-${Date.now()}@test.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'Audit',
        lastName: 'Admin',
        email,
        password: 'Password123!',
        businessName: 'Audit Test Studio',
      })
      .expect(201);

    jwtToken = registerRes.body.accessToken;
    tenantId = registerRes.body.tenantId;

    // 2. Perform an action that logs (Create client)
    await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        firstName: 'Log',
        lastName: 'Me',
        email: 'logme@example.com',
        phone: '1234567899',
      })
      .expect(201);

    // TODO: Create triggers currently don't use AuditService manually?
    // Only Update does based on my previous edit. Let's update the client to trigger a log.
    // Wait, my previous edit was to `ClientsService.update`. Let's create then update.
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  it('/audit (GET) - should return audit logs', async () => {
    // First get the client ID
    const clientsRes = await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    const client = clientsRes.body.data[0];

    // Update client to trigger audit log
    await request(app.getHttpServer())
      .patch(`/clients/${client.id}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ firstName: 'Updated' })
      .expect(200);

    // Fetch logs
    return request(app.getHttpServer())
      .get('/audit')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Should at least be 1 if active logging works on update
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        const updateLog = res.body.find(
          (l: any) => l.action === 'UPDATE_CLIENT',
        );
        expect(updateLog).toBeDefined();
        expect(updateLog.details.changes).toHaveProperty('firstName');
      });
  });
});
