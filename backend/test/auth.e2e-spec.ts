import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;

  const testEmail = `e2e-test-${Date.now()}@example.com`;
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
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new tenant owner', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'E2E',
          lastName: 'Tester',
          businessName: 'E2E Test Studio',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tenant');
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.role).toBe('tenant_owner');

      accessToken = response.body.accessToken;
      tenantId = response.body.tenant.id;
    });

    it('should reject duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Duplicate',
          lastName: 'User',
          businessName: 'Duplicate Studio',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid',
          password: '123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
          tenantId: tenantId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmail);

      accessToken = response.body.accessToken;
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
          tenantId: tenantId,
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
          tenantId: tenantId,
        })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject access without token', async () => {
      await request(app.getHttpServer()).get('/auth/users').expect(401);
    });

    it('should reject access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
