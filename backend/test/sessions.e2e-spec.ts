import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';

describe('Sessions E2E Tests', () => {
    let app: INestApplication;
    let accessToken: string;
    let tenantId: string;
    let studioId: string;
    let roomId: string;
    let coachId: string;
    let clientId: string;
    let sessionId: string;
    let packageId: string;

    const testEmail = `e2e-sessions-${Date.now()}@example.com`;
    const testPassword = 'SecurePass123!';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        // Register and login to get access token
        const registerResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: testEmail,
                password: testPassword,
                firstName: 'Session',
                lastName: 'Tester',
                businessName: 'Session Test Studio',
            })
            .expect(201);

        accessToken = registerResponse.body.accessToken;
        tenantId = registerResponse.body.tenant.id;

        // Create a studio
        const studioResponse = await request(app.getHttpServer())
            .post('/studios')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'E2E Test Studio',
                address: '123 Test St',
                city: 'Test City',
                country: 'Test Country',
                openingHours: {
                    monday: { open: '07:00', close: '21:00' },
                    tuesday: { open: '07:00', close: '21:00' },
                    wednesday: { open: '07:00', close: '21:00' },
                    thursday: { open: '07:00', close: '21:00' },
                    friday: { open: '07:00', close: '21:00' },
                },
            })
            .expect(201);
        studioId = studioResponse.body.id;

        // Create a room
        const roomResponse = await request(app.getHttpServer())
            .post('/rooms')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                studioId,
                name: 'E2E Test Room',
                capacity: 2,
            })
            .expect(201);
        roomId = roomResponse.body.id;

        // Create a coach with user account
        const coachResponse = await request(app.getHttpServer())
            .post('/coaches/create-with-user')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                email: `coach-${Date.now()}@example.com`,
                password: testPassword,
                firstName: 'Test',
                lastName: 'Coach',
                gender: 'male',
                studioId,
            })
            .expect(201);
        coachId = coachResponse.body.id;

        // Create a client
        const clientResponse = await request(app.getHttpServer())
            .post('/clients')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                firstName: 'Test',
                lastName: 'Client',
                email: `client-${Date.now()}@example.com`,
                phone: '123-456-7890',
            })
            .expect(201);
        clientId = clientResponse.body.id;

        // Create a package
        const packageResponse = await request(app.getHttpServer())
            .post('/packages')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Test Package',
                totalSessions: 10,
                price: 450,
                validityDays: 90,
            })
            .expect(201);
        packageId = packageResponse.body.id;

        // Assign package to client
        await request(app.getHttpServer())
            .post('/client-packages')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                clientId,
                packageId,
            })
            .expect(201);
    }, 60000);

    afterAll(async () => {
        await app?.close();
    });

    describe('POST /sessions', () => {
        it('should create a session', async () => {
            // Get next weekday
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
                tomorrow.setDate(tomorrow.getDate() + 1);
            }

            const response = await request(app.getHttpServer())
                .post('/sessions')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    studioId,
                    roomId,
                    coachId,
                    clientId,
                    startTime: tomorrow.toISOString(),
                    endTime: new Date(tomorrow.getTime() + 20 * 60000).toISOString(),
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.status).toBe('scheduled');
            sessionId = response.body.id;
        });

        it('should detect room conflict', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
                tomorrow.setDate(tomorrow.getDate() + 1);
            }

            // Try to book same room at same time
            await request(app.getHttpServer())
                .post('/sessions')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    studioId,
                    roomId,
                    coachId,
                    clientId,
                    startTime: tomorrow.toISOString(),
                    endTime: new Date(tomorrow.getTime() + 20 * 60000).toISOString(),
                })
                .expect(400);
        });
    });

    describe('GET /sessions', () => {
        it('should list sessions', async () => {
            const response = await request(app.getHttpServer())
                .get('/sessions')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter sessions by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/sessions?status=scheduled')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach((session: any) => {
                expect(session.status).toBe('scheduled');
            });
        });
    });

    describe('GET /sessions/:id', () => {
        it('should get session by id', async () => {
            const response = await request(app.getHttpServer())
                .get(`/sessions/${sessionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.id).toBe(sessionId);
        });

        it('should return 404 for non-existent session', async () => {
            await request(app.getHttpServer())
                .get('/sessions/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });

    describe('PATCH /sessions/:id/status', () => {
        it('should update session status to in_progress', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/sessions/${sessionId}/status`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'in_progress' })
                .expect(200);

            expect(response.body.status).toBe('in_progress');
        });

        it('should complete session', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/sessions/${sessionId}/status`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'completed' })
                .expect(200);

            expect(response.body.status).toBe('completed');
        });
    });

    describe('Recurrence', () => {
        let parentSessionId: string;

        it('should create a recurring session', async () => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(10, 0, 0, 0);

            // Ensure not weekend
            while (nextWeek.getDay() === 0 || nextWeek.getDay() === 6) {
                nextWeek.setDate(nextWeek.getDate() + 1);
            }

            const endDate = new Date(nextWeek);
            endDate.setDate(endDate.getDate() + 14); // 2 more weeks

            const response = await request(app.getHttpServer())
                .post('/sessions')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    studioId,
                    roomId,
                    coachId,
                    clientId,
                    startTime: nextWeek.toISOString(),
                    endTime: new Date(nextWeek.getTime() + 20 * 60000).toISOString(),
                    recurrencePattern: 'weekly',
                    recurrenceEndDate: endDate.toISOString().split('T')[0] // YYYY-MM-DD
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.isRecurringParent).toBe(true); // Or however backend indicates it. 
            // Actually implementation creates session and generates futures. 
            // The response itself is the FIRST session.
            parentSessionId = response.body.id;
        });

        it('should update series', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/sessions/${parentSessionId}/series`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    notes: 'Updated series notes'
                })
                .expect(200);

            // Should return something indicating success? Void?
        });

        it('should delete series', async () => {
            await request(app.getHttpServer())
                .delete(`/sessions/${parentSessionId}/series`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            // Verify parent is gone
            await request(app.getHttpServer())
                .get(`/sessions/${parentSessionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });
});
