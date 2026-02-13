import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Client } from '../../clients/entities/client.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Transaction } from '../../packages/entities/transaction.entity';
import { PlatformRevenue, RevenueStatus } from '../entities/platform-revenue.entity';

export interface GlobalAnalytics {
  revenue: RevenueAnalytics;
  usage: UsageTrends;
  growth: GrowthMetrics;
  engagement: EngagementMetrics;
}

export interface RevenueAnalytics {
  totalRevenue: number; // Combined
  saasRevenue: number; // Platform fees
  gmvRevenue: number; // Tenant transactions
  revenueByPeriod: { date: string; amount: number; saas?: number; gmv?: number }[];
  revenueByPlan: { plan: string; amount: number }[];
  averageRevenuePerTenant: number;
  projectedMonthly: number;
}

export interface UsageTrends {
  totalSessions: number;
  sessionsByDay: { date: string; count: number }[];
  avgSessionsPerTenant: number;
  peakHour: number;
  automation: AutomationMetrics;
  messaging: MessagingMetrics;
}

export interface AutomationMetrics {
  totalExecutions: number;
  successRate: number;
  executionsByType: { type: string; count: number }[];
  averageExecutionsPerTenant: number;
}

export interface MessagingMetrics {
  totalSMSSent: number;
  totalEmailsSent: number;
  smsDeliveryRate: number;
  emailOpenRate: number;
  messagesByDay: { date: string; sms: number; email: number }[];
}

export interface GrowthMetrics {
  newTenantsThisMonth: number;
  newTenantsLastMonth: number;
  tenantGrowthRate: number;
  newClientsThisMonth: number;
  clientGrowthRate: number;
  churnRate: number;
}

export interface EngagementMetrics {
  activeTenants7d: number;
  activeTenants30d: number;
  avgLoginsPerTenant: number;
  featureAdoptionRates: { feature: string; adoptionRate: number }[];
}

@Injectable()
export class OwnerAnalyticsService {
  private readonly logger = new Logger(OwnerAnalyticsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(PlatformRevenue)
    private readonly platformRevenueRepository: Repository<PlatformRevenue>,
  ) { }

  /**
   * Get comprehensive global analytics
   */
  async getGlobalAnalytics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<GlobalAnalytics> {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || now;

    const [revenue, usage, growth, engagement] = await Promise.all([
      this.getRevenueAnalytics(start, end),
      this.getUsageTrends(start, end),
      this.getGrowthMetrics(),
      this.getEngagementMetrics(),
    ]);

    return { revenue, usage, growth, engagement };
  }

  /**
   * Revenue analytics across all tenants
   */
  async getRevenueAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueAnalytics> {
    try {
      // Total revenue from transactions
      const gmvRevenueResult = await this.transactionRepository
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .where('t.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .andWhere('t.type = :type', { type: 'credit' })
        .getRawOne();

      const gmvRevenue = parseFloat(gmvRevenueResult?.total || '0');

      // Platform SaaS Revenue
      const saasRevenueResult = await this.platformRevenueRepository
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.createdAt BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .andWhere('p.status = :status', { status: RevenueStatus.COMPLETED })
        .getRawOne();

      const saasRevenue = parseFloat(saasRevenueResult?.total || '0');

      const totalRevenue = saasRevenue + gmvRevenue;

      // Revenue by period (last 12 months)
      const revenueByPeriod = await this.getDetailedRevenueByPeriod(12);

      // Revenue by plan (would need plan info on tenants)
      const revenueByPlan: { plan: string; amount: number }[] = [];

      // Count active tenants
      const tenantCount = await this.tenantRepository.count();
      const averageRevenuePerTenant =
        tenantCount > 0 ? totalRevenue / tenantCount : 0;

      // Project monthly revenue based on current month's rate
      const daysInMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        0,
      ).getDate();
      const dayOfMonth = endDate.getDate();
      const projectedMonthlyRevenue = (totalRevenue / dayOfMonth) * daysInMonth;

      return {
        totalRevenue,
        saasRevenue,
        gmvRevenue,
        revenueByPeriod,
        revenueByPlan,
        averageRevenuePerTenant,
        projectedMonthly: projectedMonthlyRevenue,
      };
    } catch (error) {
      this.logger.error(`Failed to get revenue analytics: ${error.message}`);
      return {
        totalRevenue: 0,
        saasRevenue: 0,
        gmvRevenue: 0,
        revenueByPeriod: [],
        revenueByPlan: [],
        averageRevenuePerTenant: 0,
        projectedMonthly: 0,
      };
    }
  }

  /**
   * Usage trends analysis
   */
  async getUsageTrends(startDate: Date, endDate: Date): Promise<UsageTrends> {
    try {
      // Total sessions in period
      const totalSessions = await this.sessionRepository.count({
        where: {
          startTime: Between(startDate, endDate),
        },
      });

      // Sessions by day
      const sessionsByDay = await this.getSessionsByDay(startDate, endDate);

      // Average sessions per tenant
      const tenantCount = await this.tenantRepository.count();
      const avgSessionsPerTenant =
        tenantCount > 0 ? totalSessions / tenantCount : 0;

      // Peak usage hour (simplified - would need more data)
      const peakHour = 10; // Default, would calculate from session start times

      // Automation metrics (placeholder - would integrate with marketing module)
      const automation: AutomationMetrics = {
        totalExecutions: 0,
        successRate: 0,
        executionsByType: [],
        averageExecutionsPerTenant: 0,
      };

      // Messaging metrics (placeholder - would integrate with mailer/notifications)
      const messaging: MessagingMetrics = {
        totalSMSSent: 0,
        totalEmailsSent: 0,
        smsDeliveryRate: 0,
        emailOpenRate: 0,
        messagesByDay: [],
      };

      return {
        totalSessions,
        sessionsByDay,
        avgSessionsPerTenant,
        peakHour,
        automation,
        messaging,
      };
    } catch (error) {
      this.logger.error(`Failed to get usage trends: ${error.message}`);
      return {
        totalSessions: 0,
        sessionsByDay: [],
        avgSessionsPerTenant: 0,
        peakHour: 10,
        automation: {
          totalExecutions: 0,
          successRate: 0,
          executionsByType: [],
          averageExecutionsPerTenant: 0,
        },
        messaging: {
          totalSMSSent: 0,
          totalEmailsSent: 0,
          smsDeliveryRate: 0,
          emailOpenRate: 0,
          messagesByDay: [],
        },
      };
    }
  }

  /**
   * Growth metrics
   */
  async getGrowthMetrics(): Promise<GrowthMetrics> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    try {
      // New tenants this month
      const newTenantsThisMonth = await this.tenantRepository.count({
        where: {
          createdAt: MoreThan(thisMonthStart),
        },
      });

      // New tenants last month
      const newTenantsLastMonth = await this.tenantRepository.count({
        where: {
          createdAt: Between(lastMonthStart, lastMonthEnd),
        },
      });

      // Tenant growth rate
      const tenantGrowthRate =
        newTenantsLastMonth > 0
          ? ((newTenantsThisMonth - newTenantsLastMonth) /
            newTenantsLastMonth) *
          100
          : 0;

      // New clients this month
      const newClientsThisMonth = await this.clientRepository.count({
        where: {
          createdAt: MoreThan(thisMonthStart),
        },
      });

      // Client growth (simplified)
      const clientGrowthRate = 0; // Would need last month's data

      // Churn rate (placeholder - would need subscription data)
      const churnRate = 0;

      return {
        newTenantsThisMonth,
        newTenantsLastMonth,
        tenantGrowthRate,
        newClientsThisMonth,
        clientGrowthRate,
        churnRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get growth metrics: ${error.message}`);
      return {
        newTenantsThisMonth: 0,
        newTenantsLastMonth: 0,
        tenantGrowthRate: 0,
        newClientsThisMonth: 0,
        clientGrowthRate: 0,
        churnRate: 0,
      };
    }
  }

  /**
   * Engagement metrics
   */
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Active tenants (with sessions in last 7 days)
      const activeTenants7d = await this.sessionRepository
        .createQueryBuilder('s')
        .select('COUNT(DISTINCT s.tenantId)', 'count')
        .where('s.startTime > :date', { date: sevenDaysAgo })
        .getRawOne()
        .then((r) => parseInt(r?.count || '0', 10));

      // Active tenants (with sessions in last 30 days)
      const activeTenants30d = await this.sessionRepository
        .createQueryBuilder('s')
        .select('COUNT(DISTINCT s.tenantId)', 'count')
        .where('s.startTime > :date', { date: thirtyDaysAgo })
        .getRawOne()
        .then((r) => parseInt(r?.count || '0', 10));

      // Feature adoption rates (placeholder)
      const featureAdoptionRates: { feature: string; adoptionRate: number }[] =
        [];

      return {
        activeTenants7d,
        activeTenants30d,
        avgLoginsPerTenant: 0, // Would need login tracking
        featureAdoptionRates,
      };
    } catch (error) {
      this.logger.error(`Failed to get engagement metrics: ${error.message}`);
      return {
        activeTenants7d: 0,
        activeTenants30d: 0,
        avgLoginsPerTenant: 0,
        featureAdoptionRates: [],
      };
    }
  }

  /**
   * Get revenue by period (monthly)
   */
  private async getRevenueByPeriod(
    months: number,
  ): Promise<{ date: string; amount: number }[]> {
    const results: { date: string; amount: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      try {
        const result = await this.transactionRepository
          .createQueryBuilder('t')
          .select('SUM(t.amount)', 'total')
          .where('t.createdAt BETWEEN :start AND :end', { start, end })
          .andWhere('t.type = :type', { type: 'credit' })
          .getRawOne();

        results.push({
          date: start.toISOString().slice(0, 7), // YYYY-MM format
          amount: parseFloat(result?.total || '0'),
        });
      } catch {
        results.push({ date: start.toISOString().slice(0, 7), amount: 0 });
      }
    }

    return results;
  }

  /**
   * Get combined revenue by period (monthly) with breakdown
   */
  private async getDetailedRevenueByPeriod(
    months: number,
  ): Promise<{ date: string; amount: number; saas: number; gmv: number }[]> {
    const results: { date: string; amount: number; saas: number; gmv: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      try {
        const [gmvResult, saasResult] = await Promise.all([
          this.transactionRepository
            .createQueryBuilder('t')
            .select('SUM(t.amount)', 'total')
            .where('t.createdAt BETWEEN :start AND :end', { start, end })
            .andWhere('t.type = :type', { type: 'credit' })
            .getRawOne(),
          this.platformRevenueRepository
            .createQueryBuilder('p')
            .select('SUM(p.amount)', 'total')
            .where('p.createdAt BETWEEN :start AND :end', { start, end })
            .andWhere('p.status = :status', { status: RevenueStatus.COMPLETED })
            .getRawOne(),
        ]);

        const gmv = parseFloat(gmvResult?.total || '0');
        const saas = parseFloat(saasResult?.total || '0');

        results.push({
          date: start.toISOString().slice(0, 7),
          amount: gmv + saas,
          gmv,
          saas,
        });
      } catch {
        results.push({ date: start.toISOString().slice(0, 7), amount: 0, gmv: 0, saas: 0 });
      }
    }

    return results;
  }

  /**
   * Get sessions by day
   */
  private async getSessionsByDay(
    startDate: Date,
    endDate: Date,
  ): Promise<{ date: string; count: number }[]> {
    try {
      const results = await this.sessionRepository
        .createQueryBuilder('s')
        .select('DATE(s.startTime)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('s.startTime BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .groupBy('DATE(s.startTime)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return results.map((r) => ({
        date: r.date,
        count: parseInt(r.count, 10),
      }));
    } catch {
      return [];
    }
  }
}
