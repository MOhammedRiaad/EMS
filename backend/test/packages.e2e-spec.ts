import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';

describe('Packages E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;
  let packageId: string;
  let clientId: string;
  let clientPackageId: string;

  const testEmail = `e2e-packages-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Register and login
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Package',
        lastName: 'Tester',
        businessName: 'Package Test Studio',
      });

    accessToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.tenant.id;

    // Create a client for testing assignments
    const clientResponse = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Package',
        lastName: 'Client',
        email: `pkg-client-${Date.now()}@example.com`,
        phone: '123-456-7890',
      });
    clientId = clientResponse.body.id;
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  describe('POST /packages', () => {
    it('should create a package', async () => {
      const response = await request(app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '10 Session Pack',
          description: 'Standard package with 10 sessions',
          totalSessions: 10,
          price: 450,
          validityDays: 90,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('10 Session Pack');
      expect(response.body.totalSessions).toBe(10);
      packageId = response.body.id;
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Invalid Package',
        })
        .expect(400);
    });
  });

  describe('GET /packages', () => {
    it('should list all packages', async () => {
      const response = await request(app.getHttpServer())
        .get('/packages')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /packages/:id', () => {
    it('should update package', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          price: 500,
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.price).toBe(500);
      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('POST /client-packages', () => {
    it('should assign package to client', async () => {
      const response = await request(app.getHttpServer())
        .post('/client-packages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          packageId,
          paymentMethod: 'card',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.clientId).toBe(clientId);
      expect(response.body.sessionsRemaining).toBe(10);
      expect(response.body.status).toBe('active');
      clientPackageId = response.body.id;
    });
  });

  describe('GET /client-packages/client/:clientId', () => {
    it('should get client packages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/client-packages/client/${clientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].clientId).toBe(clientId);
    });
  });

  describe('PATCH /client-packages/:id/use-session', () => {
    it('should deduct a session from client package', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/client-packages/${clientPackageId}/use-session`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.sessionsRemaining).toBe(9);
      expect(response.body.sessionsUsed).toBe(1);
    });
    describe('PATCH /client-packages/:id/adjust-sessions', () => {
      it('should manually increase sessions', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/client-packages/${clientPackageId}/adjust-sessions`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            adjustment: 2,
            reason: 'Admin bonus',
          })
          .expect(200);

        // Previous remaining was 9 (started 10, used 1). Added 2 => 11.
        expect(response.body.sessionsRemaining).toBe(11);
      });

      it('should manually decrease sessions', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/client-packages/${clientPackageId}/adjust-sessions`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            adjustment: -5,
            reason: 'Admin correction',
          })
          .expect(200);

        // 11 - 5 = 6
        expect(response.body.sessionsRemaining).toBe(6);
      });

      it('should fail if decreasing more than remaining', async () => {
        await request(app.getHttpServer())
          .patch(`/client-packages/${clientPackageId}/adjust-sessions`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            adjustment: -20,
            reason: 'Error',
          })
          .expect(400);
      });
    });
  });

  describe('GET /transactions/balance', () => {
    it('should get balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/balance')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
    });
  });
});
