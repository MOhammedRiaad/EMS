import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ClientAchievement,
  AchievementType,
} from './entities/client-achievement.entity';
import { Session } from '../sessions/entities/session.entity';
import { ClientSessionReview } from '../reviews/entities/review.entity';
import { ClientGoal, GoalStatus } from './entities/client-goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';

import { Client } from '../clients/entities/client.entity';
import { LeaderboardEntryDto } from './dto/leaderboard.dto';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(ClientAchievement)
    private readonly achievementRepo: Repository<ClientAchievement>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(ClientGoal)
    private readonly goalRepo: Repository<ClientGoal>,
    @InjectRepository(ClientSessionReview)
    private readonly reviewRepo: Repository<ClientSessionReview>,
  ) {}

  async getLeaderboard(
    tenantId: string,
    currentClientId?: string,
  ): Promise<LeaderboardEntryDto[]> {
    const raw = await this.clientRepo
      .createQueryBuilder('client')
      .leftJoin('client.sessions', 'session', 'session.status = :status', {
        status: 'completed',
      })
      .select([
        'client.id',
        'client.firstName',
        'client.lastName',
        'client.avatarUrl',
        'COUNT(session.id) as score',
      ])
      .where('client.tenantId = :tenantId', { tenantId })
      .andWhere('client.status = :clientStatus', { clientStatus: 'active' })
      // Logic for privacy: Allow if null OR preferences->>'leaderboard_visible' != 'false'
      .andWhere(
        `(client.privacy_preferences IS NULL OR client.privacy_preferences->>'leaderboard_visible' != 'false')`,
      )
      .groupBy('client.id')
      .orderBy('"score"', 'DESC') // Quote alias in orderBy for Postgres safety if needed, usually TypeORM handles aliases
      .limit(50)
      .getRawMany();

    return raw.map((r, index) => ({
      rank: index + 1,
      clientId: r.client_id,
      firstName: r.client_first_name,
      lastName: r.client_last_name,
      score: parseInt(r.score, 10),
      avatarUrl: r.client_avatar_url,
      isCurrentUser: currentClientId ? r.client_id === currentClientId : false,
    }));
  }

  async getActivityFeed(tenantId: string): Promise<any[]> {
    // Fetch recent completed sessions (limit 20)
    const recentSessions = await this.sessionRepo.find({
      where: {
        tenantId,
        status: 'completed',
      },
      relations: ['client'],
      order: { startTime: 'DESC' },
      take: 20,
    });

    // Fetch recent achievements (limit 20)
    const recentAchievements = await this.achievementRepo.find({
      where: { tenantId },
      relations: ['client'],
      order: { unlockedAt: 'DESC' },
      take: 20,
    });

    // Filter valid clients & privacy
    const privacyFilter = (item: any) => {
      const client = item.client;
      if (!client || client.status !== 'active') return false;
      // Check privacy
      const prefs = client.privacyPreferences;
      // Default visible if no prefs or flag not explicitly false
      return !prefs || prefs.activity_feed_visible !== false;
    };

    const feedItems = [
      ...recentSessions.filter(privacyFilter).map((s) => ({
        id: s.id,
        type: 'session',
        date: s.startTime,
        clientName: s.client.firstName,
        clientInitial: s.client.lastName ? s.client.lastName[0] : '',
        avatarUrl: s.client.avatarUrl,
        title: 'Completed a workout',
      })),
      ...recentAchievements.filter(privacyFilter).map((a) => ({
        id: a.id,
        type: 'achievement',
        date: a.unlockedAt,
        clientName: a.client.firstName,
        clientInitial: a.client.lastName ? a.client.lastName[0] : '',
        avatarUrl: a.client.avatarUrl,
        title: `Unlocked: ${this.formatAchievementType(a.achievementType)}`,
        details: a.achievementType,
      })),
    ];

    // Sort combined
    return feedItems
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }

  private formatAchievementType(type: string): string {
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  async getClientAchievements(clientId: string, tenantId: string) {
    return this.achievementRepo.find({
      where: { clientId, tenantId },
      order: { unlockedAt: 'DESC' },
    });
  }

  async getClientGoals(clientId: string, tenantId: string) {
    return this.goalRepo.find({
      where: { clientId, tenantId },
      order: { deadline: 'ASC' },
    });
  }

  async setGoal(clientId: string, tenantId: string, dto: CreateGoalDto) {
    const { goalType, targetValue, deadline, notes } = dto;

    // Check for existing active goal
    let goal = await this.goalRepo.findOne({
      where: {
        clientId,
        tenantId,
        goalType,
        status: GoalStatus.ACTIVE,
      },
    });

    if (goal) {
      // Update existing
      goal.targetValue = targetValue;
      if (deadline) goal.deadline = new Date(deadline);
      if (notes) goal.notes = notes;
    } else {
      // Create new
      goal = this.goalRepo.create({
        clientId,
        tenantId,
        goalType,
        targetValue,
        deadline: deadline
          ? new Date(deadline)
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
        notes,
        status: GoalStatus.ACTIVE,
        startValue: null,
      });
    }

    return this.goalRepo.save(goal);
  }

  async checkAndUnlockAchievements(clientId: string, tenantId: string) {
    this.logger.log(`Checking achievements for client ${clientId}`);

    await Promise.all([
      this.checkSessionAchievements(clientId, tenantId),
      this.checkReviewAchievements(clientId, tenantId),
    ]);
  }

  private async checkSessionAchievements(clientId: string, tenantId: string) {
    const sessionCount = await this.sessionRepo.count({
      where: { clientId, tenantId, status: 'completed' } as any,
    });

    const milestones = [
      { count: 5, type: AchievementType.SESSIONS_5 },
      { count: 10, type: AchievementType.SESSIONS_10 },
      { count: 25, type: AchievementType.SESSIONS_25 },
      { count: 50, type: AchievementType.SESSIONS_50 },
      { count: 100, type: AchievementType.SESSIONS_100 },
    ];

    for (const milestone of milestones) {
      if (sessionCount >= milestone.count) {
        await this.unlockAchievement(clientId, tenantId, milestone.type);
      }
    }
  }

  private async checkReviewAchievements(clientId: string, tenantId: string) {
    const reviewCount = await this.reviewRepo.count({
      where: { session: { clientId, tenantId } },
    });

    if (reviewCount >= 1) {
      await this.unlockAchievement(
        clientId,
        tenantId,
        AchievementType.FIRST_REVIEW,
      );
    }
    if (reviewCount >= 5) {
      await this.unlockAchievement(
        clientId,
        tenantId,
        AchievementType.REVIEWS_5,
      );
    }
  }

  private async unlockAchievement(
    clientId: string,
    tenantId: string,
    type: AchievementType,
  ) {
    const existing = await this.achievementRepo.findOne({
      where: { clientId, tenantId, achievementType: type },
    });

    if (!existing) {
      const achievement = this.achievementRepo.create({
        clientId,
        tenantId,
        achievementType: type,
        unlockedAt: new Date(),
      });
      await this.achievementRepo.save(achievement);
      this.logger.log(`Achievement unlocked: ${type} for client ${clientId}`);
    }
  }
}
