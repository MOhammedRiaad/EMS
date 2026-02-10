import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoachTimeOffRequest } from '../src/modules/coaches/entities/coach-time-off.entity';
import { DataSource } from 'typeorm';
import { FeatureFlag } from '../src/modules/owner/entities/feature-flag.entity';
import { FeatureAssignment } from '../src/modules/owner/entities/feature-assignment.entity';

describe('Sessions E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;
  let tenantId: string;
  let studioId: string;
  let roomId: string;
  let coachId: string;
  let clientId: string;
  let dataSource: DataSource;
  let sessionId: string;
  let packageId: string;
  let coachEmail: string;
  let coachToken: string;

  const testEmail = `e2e-sessions-${Date.now()}@example.com`;
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

    dataSource = moduleFixture.get<DataSource>(DataSource);

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
    coachEmail = `coach-${Date.now()}@example.com`;
    const coachResponse = await request(app.getHttpServer())
      .post('/coaches/create-with-user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: coachEmail,
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
        studioId,
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

    // Enable features for the test tenant to bypass security guards
    const featureRepo = dataSource.getRepository(FeatureFlag);
    const assignmentRepo = dataSource.getRepository(FeatureAssignment);

    // 1. Ensure features exist
    const features = await featureRepo.save([
      {
        key: 'client.portal',
        name: 'Client Portal',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'coach.portal',
        name: 'Coach Portal',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'client.booking',
        name: 'Client Booking',
        category: 'core',
        defaultEnabled: true,
      },
      {
        key: 'client.progress_photos',
        name: 'Progress Photos',
        category: 'core',
        defaultEnabled: true,
      },
    ]);

    // 2. Enable them for the tenant
    const platformOwnerId = '00000000-0000-0000-0000-000000000000';
    await assignmentRepo.save(
      features.map((f) => ({
        tenantId,
        featureKey: f.key,
        enabled: true,
        enabledBy: platformOwnerId,
      })),
    );
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
          recurrenceEndDate: endDate.toISOString().split('T')[0], // YYYY-MM-DD
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
          notes: 'Updated series notes',
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
  describe('Studio Isolation', () => {
    let studio2Id: string;
    let coach2Id: string; // Assigned to studio 2
    let client2Id: string; // Assigned to studio 2

    beforeAll(async () => {
      // Create Studio 2
      const studioResponse = await request(app.getHttpServer())
        .post('/studios')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Isolation Test Studio',
          address: '456 Isolation Rd',
          city: 'Iso City',
          country: 'Iso Country',
          openingHours: {
            monday: { open: '07:00', close: '21:00' },
            tuesday: { open: '07:00', close: '21:00' },
            wednesday: { open: '07:00', close: '21:00' },
            thursday: { open: '07:00', close: '21:00' },
            friday: { open: '07:00', close: '21:00' },
          },
        })
        .expect(201);
      studio2Id = studioResponse.body.id;

      // Create Coach 2 (assigned to Studio 2)
      const coachResponse = await request(app.getHttpServer())
        .post('/coaches/create-with-user')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: `coach2-${Date.now()}@example.com`,
          password: testPassword,
          firstName: 'Coach',
          lastName: 'Two',
          gender: 'male',
          studioId: studio2Id,
        })
        .expect(201);
      coach2Id = coachResponse.body.id;

      // Create Client 2 (assigned to Studio 2)
      const clientResponse = await request(app.getHttpServer())
        .post('/clients/create-with-user')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: `client2-${Date.now()}@example.com`,
          password: testPassword,
          firstName: 'Client',
          lastName: 'Two',
          studioId: studio2Id,
        })
        .expect(201);
      client2Id = clientResponse.body.id;
    });

    it('should fail when booking coach from different studio', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2); // Use a future date
      tomorrow.setHours(12, 0, 0, 0);

      // Try to book Session in Studio 1 using Coach 2 (Studio 2)
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId: studioId, // Studio 1
          roomId,
          coachId: coach2Id, // Coach from Studio 2
          clientId,
          startTime: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 20 * 60000).toISOString(),
        })
        .expect(400); // Should fail validation
    });

    it('should fail when booking client from different studio', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(13, 0, 0, 0);

      // Try to book Session in Studio 1 using Client 2 (Studio 2)
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId: studioId, // Studio 1
          roomId,
          coachId,
          clientId: client2Id, // Client from Studio 2
          startTime: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 20 * 60000).toISOString(),
        })
        .expect(400); // Should fail validation
    });
  });

  describe('Refunds', () => {
    let refundClientId: string;
    let refundPackageId: string;

    beforeAll(async () => {
      // Create dedicated client for refund tests
      const clientResponse = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Refund',
          lastName: 'Client',
          email: `refund-client-${Date.now()}@example.com`,
          phone: '000-000-0000',
          studioId: studioId,
        })
        .expect(201);
      refundClientId = clientResponse.body.id;

      // Create package
      const packageResponse = await request(app.getHttpServer())
        .post('/packages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Refund Test Package',
          totalSessions: 10,
          price: 100,
          validityDays: 30,
        })
        .expect(201);
      refundPackageId = packageResponse.body.id;

      // Assign package
      await request(app.getHttpServer())
        .post('/client-packages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId: refundClientId,
          packageId: refundPackageId,
        })
        .expect(201);
    });

    const getRemainingSessions = async () => {
      const res = await request(app.getHttpServer())
        .get(`/client-packages/client/${refundClientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const activePkg = res.body.find((p: any) => p.status === 'active');
      return activePkg ? activePkg.sessionsRemaining : 0;
    };

    it('should refund individual session on delete', async () => {
      const initialRemaining = await getRemainingSessions();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      tomorrow.setHours(10, 0, 0, 0);
      while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }

      const createRes = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId,
          roomId, // Assuming roomId is available from main scope
          coachId, // Assuming coachId is available from main scope
          clientId: refundClientId,
          startTime: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 20 * 60000).toISOString(),
          type: 'individual',
        })
        .expect(201);

      const sId = createRes.body.id;

      const afterBooking = await getRemainingSessions();
      expect(afterBooking).toBe(initialRemaining - 1);

      await request(app.getHttpServer())
        .delete(`/sessions/${sId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const afterDelete = await getRemainingSessions();
      expect(afterDelete).toBe(initialRemaining);
    });

    it('should refund group participant on session delete', async () => {
      const initialRemaining = await getRemainingSessions();

      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 6);
      dayAfter.setHours(11, 0, 0, 0);
      while (dayAfter.getDay() === 0 || dayAfter.getDay() === 6) {
        dayAfter.setDate(dayAfter.getDate() + 1);
      }

      const createRes = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId,
          roomId,
          coachId,
          startTime: dayAfter.toISOString(),
          endTime: new Date(dayAfter.getTime() + 30 * 60000).toISOString(),
          type: 'group',
          capacity: 5,
        })
        .expect(201);

      const sId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/sessions/${sId}/participants/${refundClientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const afterBooking = await getRemainingSessions();
      expect(afterBooking).toBe(initialRemaining - 1);

      await request(app.getHttpServer())
        .delete(`/sessions/${sId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const afterDelete = await getRemainingSessions();
      expect(afterDelete).toBe(initialRemaining);
    });
  });

  describe('PATCH /sessions/:id - Reschedule', () => {
    let rescheduleSessionId: string;
    let rescheduleStart: Date;

    beforeAll(async () => {
      // Create a session to reschedule
      rescheduleStart = new Date();
      rescheduleStart.setDate(rescheduleStart.getDate() + 8);
      rescheduleStart.setHours(9, 0, 0, 0);

      while (rescheduleStart.getDay() === 0 || rescheduleStart.getDay() === 6) {
        rescheduleStart.setDate(rescheduleStart.getDate() + 1);
      }

      const createRes = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId,
          roomId,
          coachId,
          clientId,
          startTime: rescheduleStart.toISOString(),
          endTime: new Date(
            rescheduleStart.getTime() + 20 * 60000,
          ).toISOString(),
        })
        .expect(201);

      rescheduleSessionId = createRes.body.id;
    });

    it('should reschedule a session with allowTimeChangeOverride', async () => {
      const newStart = new Date(rescheduleStart);
      newStart.setHours(11, 0, 0, 0);
      const newEnd = new Date(newStart.getTime() + 20 * 60000);

      const response = await request(app.getHttpServer())
        .patch(`/sessions/${rescheduleSessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          allowTimeChangeOverride: true,
        })
        .expect(200);

      expect(new Date(response.body.startTime).getTime()).toBe(
        newStart.getTime(),
      );
      expect(new Date(response.body.endTime).getTime()).toBe(newEnd.getTime());
      // Verify relations are returned
      expect(response.body.room).toBeDefined();
      expect(response.body.coach).toBeDefined();
    });

    it('should reject reschedule without allowTimeChangeOverride', async () => {
      const newStart = new Date(rescheduleStart);
      newStart.setHours(12, 0, 0, 0);
      const newEnd = new Date(newStart.getTime() + 20 * 60000);

      await request(app.getHttpServer())
        .patch(`/sessions/${rescheduleSessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        })
        .expect(409);
    });

    it('should reject reschedule to conflicting time', async () => {
      // Create another session at a specific time
      const conflictStart = new Date(rescheduleStart);
      conflictStart.setHours(15, 0, 0, 0);
      const conflictEnd = new Date(conflictStart.getTime() + 20 * 60000);

      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId,
          roomId,
          coachId,
          clientId,
          startTime: conflictStart.toISOString(),
          endTime: conflictEnd.toISOString(),
        })
        .expect(201);

      // Try to reschedule our session to the same time/room
      await request(app.getHttpServer())
        .patch(`/sessions/${rescheduleSessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          startTime: conflictStart.toISOString(),
          endTime: conflictEnd.toISOString(),
          allowTimeChangeOverride: true,
        })
        .expect(400);
    });

    it('should return updated relations after editing room or coach', async () => {
      // First, get the current session data
      const before = await request(app.getHttpServer())
        .get(`/sessions/${rescheduleSessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(before.body.room).toBeDefined();
      expect(before.body.coach).toBeDefined();

      // Update just the notes (no conflict) — verify response includes relations
      const response = await request(app.getHttpServer())
        .patch(`/sessions/${rescheduleSessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notes: 'Updated via reschedule test',
        })
        .expect(200);

      expect(response.body.notes).toBe('Updated via reschedule test');
      expect(response.body.room).toBeDefined();
      expect(response.body.room.name).toBeDefined();
      expect(response.body.coach).toBeDefined();
    });
  });
  describe('Time-Off', () => {
    // Use outer coachToken

    beforeAll(async () => {
      // Login as Coach to get token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: coachEmail,
          password: testPassword,
        })
        .expect(201);
      coachToken = loginRes.body.accessToken;
    });

    it('should enforce time-off constraints', async () => {
      const timeOffStart = new Date();
      timeOffStart.setDate(timeOffStart.getDate() + 10);
      timeOffStart.setHours(14, 0, 0, 0);
      // Ensure not weekend
      while (timeOffStart.getDay() === 0 || timeOffStart.getDay() === 6) {
        timeOffStart.setDate(timeOffStart.getDate() + 1);
      }

      const timeOffEnd = new Date(timeOffStart);
      timeOffEnd.setHours(16, 0, 0, 0);

      // 1. Submit Time Off
      await request(app.getHttpServer())
        .post('/coach-portal/time-off')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          startDate: timeOffStart.toISOString(),
          endDate: timeOffEnd.toISOString(),
          notes: 'E2E Test Leave',
        })
        .expect(201);

      // 2. Approve Time Off (Admin override via DB)
      const timeOffRepo = app.get(getRepositoryToken(CoachTimeOffRequest));
      // Find the request (assuming usually one per coach in this test context, or query by coachId)
      // We need coachId. It is strictly available in the outer scope.
      // NOTE: coachId variable holds the ID of the coach created in the main beforeAll.
      // AND coachEmail matches that coach.
      const timeOff = await timeOffRepo.findOne({ where: { coachId } });

      if (timeOff) {
        timeOff.status = 'approved';
        await timeOffRepo.save(timeOff);
      } else {
        throw new Error('Time off request not found');
      }

      // 3. Try to book overlapping session (14:00 - 14:20)
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId,
          roomId,
          coachId,
          clientId,
          startTime: timeOffStart.toISOString(),
          endTime: new Date(timeOffStart.getTime() + 20 * 60000).toISOString(),
        })
        .expect(400) // Expect validation error due to conflicts
        .expect((res) => {
          expect(JSON.stringify(res.body)).toContain('time-off'); // Ensure message mentions time-off
        });

      // 4. Try to book NON-overlapping session (13:00 - 13:20)
      const nonOverlappingStart = new Date(timeOffStart);
      nonOverlappingStart.setHours(13, 0, 0, 0);

      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          studioId,
          roomId,
          coachId,
          clientId,
          startTime: nonOverlappingStart.toISOString(),
          endTime: new Date(
            nonOverlappingStart.getTime() + 20 * 60000,
          ).toISOString(),
        })
        .expect(201);
    });
  });
});
