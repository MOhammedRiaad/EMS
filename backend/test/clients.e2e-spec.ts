import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';

describe('ClientsModule (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let tenantId: string;
  let clientId: string;

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
    const email = `owner-${Date.now()}@test.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'Owner',
        email,
        password: 'Password123!',
        businessName: 'Clients Test Studio',
      })
      .expect(201);

    jwtToken = registerRes.body.accessToken;
    console.log('JWT Token:', jwtToken);
    tenantId = registerRes.body.tenantId;

    // 2. Create Client
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      });

    clientId = clientRes.body.id;
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  it('/clients/:id/transactions (GET) - should return empty list initially', () => {
    return request(app.getHttpServer())
      .get(`/clients/${clientId}/transactions`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
      });
  });

  it('/clients/:id/balance (POST) - should add funds', async () => {
    await request(app.getHttpServer())
      .post(`/clients/${clientId}/balance`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        amount: 50.0,
        description: 'Initial Deposit',
      })
      .expect(201);

    // Check Balance
    const clientRes = await request(app.getHttpServer())
      .get(`/clients/${clientId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(Number(clientRes.body.creditBalance)).toBe(50);
  });

  it('/clients/:id/transactions (GET) - should show the deposit', () => {
    return request(app.getHttpServer())
      .get(`/clients/${clientId}/transactions`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBe(1);
        expect(res.body[0].type).toBe('income');
        expect(Number(res.body[0].amount)).toBe(50);
        expect(res.body[0].category).toBe('manual_adjustment');
      });
  });

  it('/clients/:id/balance (POST) - should deduct funds', async () => {
    await request(app.getHttpServer())
      .post(`/clients/${clientId}/balance`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        amount: -20.0,
        description: 'Correction',
      })
      .expect(201);

    const clientRes = await request(app.getHttpServer())
      .get(`/clients/${clientId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(Number(clientRes.body.creditBalance)).toBe(30); // 50 - 20
  });

  it('/clients/:id/waivers (GET) - should return waivers list', () => {
    return request(app.getHttpServer())
      .get(`/clients/${clientId}/waivers`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/clients (GET) - with search query', async () => {
    // Create another client to distinguish
    await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        firstName: 'Alice',
        lastName: 'Searchable',
        email: 'alice@example.com',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/clients?search=Alice')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBe(1);
        expect(res.body[0].firstName).toBe('Alice');
      });

    await request(app.getHttpServer())
      .get('/clients?search=nomatch')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBe(0);
      });
  });
});
