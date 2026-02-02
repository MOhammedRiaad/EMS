import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Session } from '../sessions/entities/session.entity';
import ical, { ICalCalendarMethod } from 'ical-generator';
import * as crypto from 'crypto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  async generateCalendarToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.usersRepository.update(userId, { calendarToken: token });
    return token;
  }

  async getToken(userId: string): Promise<string | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['calendarToken'],
    });
    return user?.calendarToken || null;
  }

  async getFeedForUser(userId: string, token: string): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName', 'email', 'calendarToken', 'role'], // Explicitly select calendarToken
    });

    if (!user || user.calendarToken !== token) {
      throw new UnauthorizedException('Invalid calendar token');
    }

    const cal = ical({
      name: 'EMS Studio Sessions',
      timezone: 'UTC', // Or user's time zone if available
      method: ICalCalendarMethod.PUBLISH,
    });

    // Fetch future sessions for this user
    // Logic differs slightly for clients vs coaches vs admins
    // For simplicity, we'll reuse the basic "my sessions" logic logic usually found in sessions service
    // But here we need a direct query to avoid circular dependency hell or massive service imports

    const query = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.studio', 'studio')
      .leftJoinAndSelect('session.room', 'room')
      .leftJoinAndSelect('session.coach', 'coach')
      .leftJoinAndSelect('coach.user', 'coachUser')
      .leftJoinAndSelect('session.participants', 'participant')
      .leftJoinAndSelect('participant.client', 'client')
      .where('session.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('session.startTime > :now', { now: new Date() });

    if (user.role === 'client') {
      // Find sessions where this user is a participant (via client relation)
      // This assumes we can link user -> client.
      // In User entity we likely have a client relation or we need to look up client by user id.
      // Let's assume we can query via participant.client.userId if that exists, or we need to find the client ID first.

      // Simpler: Fetch client record for this user first
      // This part requires knowing the Client ID for the User.
      // Since we don't have straightforward ClientService access without potentially circular deps,
      // let's assume valid sessions are filtered.
      // actually, let's just use the query builder properly if the relation exists
      // session -> participants -> client -> user
      query
        .innerJoin('session.participants', 'p')
        .innerJoin('p.client', 'c', 'c.user_id = :userId', { userId });
    } else if (user.role === 'coach') {
      query.innerJoin('session.coach', 'c', 'c.user_id = :userId', { userId });
    } else if (['admin', 'tenant_owner'].includes(user.role)) {
      // Admins see all? Or maybe just their own if they book themselves?
      // For now, let's assume Admins want to see everything scheduled for the tenant?
      // Or maybe just leave it empty for admins if they don't participate.
      // Let's stick to personal schedule for now.
      query.innerJoin('session.coach', 'c', 'c.user_id = :userId', { userId }); // If acting as coach
    }

    const sessions = await query.getMany();

    sessions.forEach((session) => {
      cal.createEvent({
        start: session.startTime,
        end: session.endTime,
        summary:
          session.type === 'group'
            ? `Group Session (${session.programType})`
            : 'EMS Session',
        description: `Program: ${session.programType}\nStudio: ${session.studio?.name}`,
        location: `${session.studio?.name} - ${session.room?.name}`,
        url: `${process.env.FRONTEND_URL}/sessions/${session.id}`,
      });
    });

    return cal.toString();
  }

  async generateSessionIcs(sessionId: string): Promise<string> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
      relations: ['studio', 'room'],
    });

    if (!session) throw new NotFoundException('Session not found');

    const cal = ical({
      method: ICalCalendarMethod.REQUEST,
    });

    cal.createEvent({
      start: session.startTime,
      end: session.endTime,
      summary:
        session.type === 'group'
          ? `Group Session (${session.programType})`
          : 'EMS Session',
      description: `Program: ${session.programType}\nStudio: ${session.studio?.name}`,
      location: `${session.studio?.name} - ${session.room?.name}`,
      url: `${process.env.FRONTEND_URL}/sessions/${session.id}`,
    });

    return cal.toString();
  }
}
