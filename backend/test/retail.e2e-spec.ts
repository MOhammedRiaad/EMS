import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';

describe('RetailModule (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let productId: string;
  let studioId: string;
  let clientId: string;

  // ... (previous code)

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // 1. Register
    const email = `retail-${Date.now()}@test.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'Retail',
        lastName: 'Manager',
        email,
        password: 'Password123!',
        businessName: 'Retail Test Inc',
      })
      .expect(201);
    jwtToken = registerRes.body.accessToken;

    // 2. Create Studio
    const studioRes = await request(app.getHttpServer())
      .post('/studios')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ name: 'Main Shop', location: 'Downtown' });
    studioId = studioRes.body.id;

    // 3. Create Client (for sales)
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        firstName: 'Shopper',
        lastName: 'One',
        email: 'shopper@test.com',
        phone: '5551234',
      });
    clientId = clientRes.body.id;
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await app.close();
  });

  // --- Products ---

  it('/retail/products (POST) - create product', async () => {
    const res = await request(app.getHttpServer())
      .post('/retail/products')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Protein Shake',
        description: 'Chocolate',
        sku: 'SHAKE-001',
        price: 5.5,
        costPrice: 2.0,
        category: 'supplements',
        trackStock: true,
      })
      .expect(201);
    productId = res.body.id;
    expect(productId).toBeDefined();
  });

  it('/retail/products (GET) - list products', () => {
    return request(app.getHttpServer())
      .get('/retail/products')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].sku).toBe('SHAKE-001');
      });
  });

  // --- Stock ---

  it('should add stock to studio', async () => {
    await request(app.getHttpServer())
      .post(`/retail/stock/${studioId}/product/${productId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ quantity: 10, operation: 'add' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/retail/stock/${studioId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    const stockItem = res.body.find((s: any) => s.id === productId);
    expect(stockItem).toBeDefined();
    expect(stockItem.stockQuantity).toBe(10);
  });

  // --- Sales / POS ---

  it('/retail/sales (POST) - process sale', async () => {
    const res = await request(app.getHttpServer())
      .post('/retail/sales')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        studioId,
        clientId,
        items: [{ productId, quantity: 2 }],
        paymentMethod: 'cash',
      })
      .expect(201);

    expect(Number(res.body.totalAmount)).toBe(11.0); // 5.50 * 2
  });

  it('should deduct stock after sale', async () => {
    const res = await request(app.getHttpServer())
      .get(`/retail/stock/${studioId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    const stockItem = res.body.find((s: any) => s.id === productId);
    expect(stockItem.stockQuantity).toBe(8); // 10 - 2
  });

  // --- Reports ---

  it('/retail/transactions (GET) - POS Report', async () => {
    const res = await request(app.getHttpServer())
      .get('/retail/transactions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const tx = res.body[0];
    expect(tx.category).toBe('retail_sale');
    expect(Number(tx.amount)).toBe(11.0);
  });
});
