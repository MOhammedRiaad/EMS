import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { UsageMetric } from '../entities/usage-metric.entity';
import { Plan, PlanLimits } from '../entities/plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Client } from '../../clients/entities/client.entity';
import { Coach } from '../../coaches/entities/coach.entity';
import { Session } from '../../sessions/entities/session.entity';

export interface UsageSnapshot {
  clients: { current: number; limit: number; percentage: number };
  coaches: { current: number; limit: number; percentage: number };
  sessionsThisMonth: { current: number; limit: number; percentage: number };
  smsThisMonth: { current: number; limit: number; percentage: number };
  emailThisMonth: { current: number; limit: number; percentage: number };
  storageGB: { current: number; limit: number; percentage: number };
}

export interface LimitViolation {
  type: string;
  current: number;
  limit: number;
  plan: string;
  message: string;
}

@Injectable()
export class UsageTrackingService {
  constructor(
    @InjectRepository(UsageMetric)
    private readonly usageMetricRepository: Repository<UsageMetric>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  /**
   * Get current usage snapshot for a tenant
   */
  async getUsageSnapshot(tenantId: string): Promise<UsageSnapshot> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const plan = await this.planRepository.findOne({
      where: { key: tenant.plan },
    });
    const limits = plan?.limits || this.getDefaultLimits();

    // Get current counts
    const clientCount = await this.clientRepository.count({
      where: { tenantId },
    });
    const coachCount = await this.coachRepository.count({
      where: { tenantId, active: true },
    });

    // Get sessions this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sessionsThisMonth = await this.sessionRepository.count({
      where: {
        tenantId,
        startTime: MoreThanOrEqual(startOfMonth),
      },
    });

    // Get messaging counts from usage metrics
    const smsThisMonth = await this.getMonthlyMetric(tenantId, 'sms');
    const emailThisMonth = await this.getMonthlyMetric(tenantId, 'email');
    const storageUsed = await this.getLatestMetric(tenantId, 'storage');

    return {
      clients: this.calculateUsageItem(clientCount, limits.maxClients),
      coaches: this.calculateUsageItem(coachCount, limits.maxCoaches),
      sessionsThisMonth: this.calculateUsageItem(
        sessionsThisMonth,
        limits.maxSessionsPerMonth,
      ),
      smsThisMonth: this.calculateUsageItem(smsThisMonth, limits.smsAllowance),
      emailThisMonth: this.calculateUsageItem(
        emailThisMonth,
        limits.emailAllowance,
      ),
      storageGB: this.calculateUsageItem(storageUsed, limits.storageGB),
    };
  }

  /**
   * Check if a specific limit is exceeded
   */
  async checkLimit(
    tenantId: string,
    limitType: 'clients' | 'coaches' | 'sessions' | 'sms' | 'email' | 'storage',
  ): Promise<LimitViolation | null> {
    const snapshot = await this.getUsageSnapshot(tenantId);
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    const checkItem = (
      item: { current: number; limit: number },
      type: string,
      message: string,
    ): LimitViolation | null => {
      if (item.limit !== -1 && item.current >= item.limit) {
        return {
          type,
          current: item.current,
          limit: item.limit,
          plan: tenant?.plan || 'unknown',
          message,
        };
      }
      return null;
    };

    switch (limitType) {
      case 'clients':
        return checkItem(
          snapshot.clients,
          'clients',
          'Client limit reached. Upgrade your plan to add more clients.',
        );
      case 'coaches':
        return checkItem(
          snapshot.coaches,
          'coaches',
          'Coach limit reached. Upgrade your plan to add more coaches.',
        );
      case 'sessions':
        return checkItem(
          snapshot.sessionsThisMonth,
          'sessions',
          'Monthly session limit reached. Upgrade your plan to book more sessions.',
        );
      case 'sms':
        return checkItem(
          snapshot.smsThisMonth,
          'sms',
          'SMS allowance exhausted. Upgrade your plan to send more SMS messages.',
        );
      case 'email':
        return checkItem(
          snapshot.emailThisMonth,
          'email',
          'Email allowance exhausted. Upgrade your plan to send more emails.',
        );
      case 'storage':
        return checkItem(
          snapshot.storageGB,
          'storage',
          'Storage limit reached. Upgrade your plan for more storage.',
        );
      default:
        return null;
    }
  }

  /**
   * Enforce a limit - throws ForbiddenException if exceeded
   */
  async enforceLimit(
    tenantId: string,
    limitType: 'clients' | 'coaches' | 'sessions' | 'sms' | 'email' | 'storage',
  ): Promise<void> {
    const violation = await this.checkLimit(tenantId, limitType);

    if (violation) {
      // Update tenant block status
      await this.tenantRepository.update(tenantId, {
        isBlocked: true,
        blockReason: `${violation.type} limit exceeded: ${violation.current}/${violation.limit}`,
      });

      throw new ForbiddenException({
        statusCode: 402,
        message: violation.message,
        error: 'Payment Required',
        details: {
          type: violation.type,
          limit: violation.limit,
          current: violation.current,
          plan: violation.plan,
          action: 'Upgrade your plan to continue',
        },
      });
    }
  }

  /**
   * Record a usage metric
   */
  async recordMetric(
    tenantId: string,
    metricType: string,
    value: number,
    period: 'daily' | 'monthly' = 'daily',
    metadata?: Record<string, any>,
  ): Promise<UsageMetric> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already have a record for today
    let metric = await this.usageMetricRepository.findOne({
      where: { tenantId, metricType, period, date: today },
    });

    if (metric) {
      metric.value += value;
      if (metadata) {
        metric.metadata = { ...metric.metadata, ...metadata };
      }
    } else {
      metric = this.usageMetricRepository.create({
        tenantId,
        metricType,
        value,
        period,
        date: today,
        metadata,
      });
    }

    return this.usageMetricRepository.save(metric);
  }

  /**
   * Clear tenant block status (called when plan is upgraded)
   */
  async clearBlockStatus(tenantId: string): Promise<void> {
    await this.tenantRepository.update(tenantId, {
      isBlocked: false,
      blockReason: null,
    });
  }

  /**
   * Update cached usage stats for a tenant
   */
  async updateCachedUsageStats(tenantId: string): Promise<void> {
    const snapshot = await this.getUsageSnapshot(tenantId);
    await this.tenantRepository.update(tenantId, {
      usageStats: snapshot as any,
      lastActivityAt: new Date(),
    });
  }

  /**
   * Get aggregated usage across all tenants (for owner dashboard)
   */
  async getGlobalUsageStats(): Promise<{
    totalClients: number;
    totalCoaches: number;
    totalSessionsThisMonth: number;
    totalSmsThisMonth: number;
    totalEmailThisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalClients, totalCoaches, totalSessionsThisMonth] =
      await Promise.all([
        this.clientRepository.count(),
        this.coachRepository.count({ where: { active: true } }),
        this.sessionRepository.count({
          where: { startTime: MoreThanOrEqual(startOfMonth) },
        }),
      ]);

    // Get aggregated SMS/email from usage metrics
    const smsMetrics = await this.usageMetricRepository
      .createQueryBuilder('metric')
      .select('SUM(metric.value)', 'total')
      .where('metric.metricType = :type', { type: 'sms' })
      .andWhere('metric.date >= :startOfMonth', { startOfMonth })
      .getRawOne();

    const emailMetrics = await this.usageMetricRepository
      .createQueryBuilder('metric')
      .select('SUM(metric.value)', 'total')
      .where('metric.metricType = :type', { type: 'email' })
      .andWhere('metric.date >= :startOfMonth', { startOfMonth })
      .getRawOne();

    return {
      totalClients,
      totalCoaches,
      totalSessionsThisMonth,
      totalSmsThisMonth: parseInt(smsMetrics?.total || '0', 10),
      totalEmailThisMonth: parseInt(emailMetrics?.total || '0', 10),
    };
  }

  // Helper methods
  private calculateUsageItem(
    current: number,
    limit: number,
  ): { current: number; limit: number; percentage: number } {
    if (limit === -1) {
      return { current, limit: -1, percentage: 0 }; // Unlimited
    }
    return {
      current,
      limit,
      percentage: limit > 0 ? Math.round((current / limit) * 100) : 0,
    };
  }

  private async getMonthlyMetric(
    tenantId: string,
    metricType: string,
  ): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.usageMetricRepository
      .createQueryBuilder('metric')
      .select('SUM(metric.value)', 'total')
      .where('metric.tenantId = :tenantId', { tenantId })
      .andWhere('metric.metricType = :metricType', { metricType })
      .andWhere('metric.date BETWEEN :start AND :end', {
        start: startOfMonth,
        end: endOfMonth,
      })
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }

  private async getLatestMetric(
    tenantId: string,
    metricType: string,
  ): Promise<number> {
    const metric = await this.usageMetricRepository.findOne({
      where: { tenantId, metricType },
      order: { date: 'DESC' },
    });
    return metric?.value || 0;
  }

  private getDefaultLimits(): PlanLimits {
    return {
      maxClients: 100,
      maxCoaches: 5,
      maxSessionsPerMonth: 300,
      smsAllowance: 200,
      emailAllowance: 2000,
      storageGB: 20,
    };
  }
}
