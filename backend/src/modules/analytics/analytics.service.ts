import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Session } from '../sessions/entities/session.entity';
import { ClientPackage } from '../packages/entities/client-package.entity';
import { Package } from '../packages/entities/package.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Room } from '../rooms/entities/room.entity';
import { EmsDevice } from '../devices/entities/ems-device.entity';
import {
  WaitingListEntry,
  WaitingListStatus,
} from '../waiting-list/entities/waiting-list.entity';
import { ClientSessionReview } from '../reviews/entities/review.entity';
import { Lead } from '../leads/entities/lead.entity';
import { PeriodType, DateRangeQueryDto } from './dto';

interface DateRange {
  from: Date;
  to: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(ClientPackage)
    private readonly clientPackageRepo: Repository<ClientPackage>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Coach)
    private readonly coachRepo: Repository<Coach>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(EmsDevice)
    private readonly deviceRepo: Repository<EmsDevice>,
    @InjectRepository(WaitingListEntry)
    private readonly waitingListRepo: Repository<WaitingListEntry>,
    @InjectRepository(ClientSessionReview)
    private readonly reviewRepo: Repository<ClientSessionReview>,
    @InjectRepository(Lead) // New Injection
    private readonly leadRepo: Repository<Lead>,
  ) {}

  // ============= Helper Methods =============

  private getDateRange(query: DateRangeQueryDto): DateRange {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days
    return { from, to };
  }

  private getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getStartOfYear(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 0, 1);
  }

  // ============= Revenue Analytics =============

  async getRevenueSummary(tenantId: string) {
    const now = new Date();
    const startOfMonth = this.getStartOfMonth();
    const startOfYear = this.getStartOfYear();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total revenue (all time)
    const totalResult = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt IS NOT NULL')
      .select('COALESCE(SUM(p.price), 0)', 'total')
      .getRawOne();

    // MTD (Month to date)
    const mtdResult = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt >= :from', { from: startOfMonth })
      .andWhere('cp.paidAt IS NOT NULL')
      .select('COALESCE(SUM(p.price), 0)', 'total')
      .getRawOne();

    // YTD (Year to date)
    const ytdResult = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt >= :from', { from: startOfYear })
      .andWhere('cp.paidAt IS NOT NULL')
      .select('COALESCE(SUM(p.price), 0)', 'total')
      .getRawOne();

    // Last month
    const lastMonthResult = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt >= :from', { from: startOfLastMonth })
      .andWhere('cp.paidAt <= :to', { to: endOfLastMonth })
      .andWhere('cp.paidAt IS NOT NULL')
      .select('COALESCE(SUM(p.price), 0)', 'total')
      .getRawOne();

    const mtd = parseFloat(mtdResult?.total || '0');
    const lastMonth = parseFloat(lastMonthResult?.total || '0');
    const growthPercent =
      lastMonth > 0 ? ((mtd - lastMonth) / lastMonth) * 100 : 0;

    return {
      total: parseFloat(totalResult?.total || '0'),
      mtd,
      ytd: parseFloat(ytdResult?.total || '0'),
      lastMonth,
      growthPercent: Math.round(growthPercent * 10) / 10,
    };
  }

  async getRevenueByPeriod(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);
    const period = query.period || PeriodType.DAY;

    let dateFormat: string;
    switch (period) {
      case PeriodType.WEEK:
        dateFormat = 'YYYY-IW'; // ISO week
        break;
      case PeriodType.MONTH:
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const results = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt >= :from', { from })
      .andWhere('cp.paidAt <= :to', { to })
      .andWhere('cp.paidAt IS NOT NULL')
      .select(`TO_CHAR(cp.paidAt, '${dateFormat}')`, 'period')
      .addSelect('COALESCE(SUM(p.price), 0)', 'revenue')
      .addSelect('COUNT(cp.id)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      period: r.period,
      revenue: parseFloat(r.revenue || '0'),
      count: parseInt(r.count || '0', 10),
    }));
  }

  async getRevenueByPackage(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    const results = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt >= :from', { from })
      .andWhere('cp.paidAt <= :to', { to })
      .andWhere('cp.paidAt IS NOT NULL')
      .select('p.id', 'packageId')
      .addSelect('p.name', 'packageName')
      .addSelect('COALESCE(SUM(p.price), 0)', 'revenue')
      .addSelect('COUNT(cp.id)', 'count')
      .groupBy('p.id')
      .addGroupBy('p.name')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      packageId: r.packageId,
      packageName: r.packageName,
      revenue: parseFloat(r.revenue || '0'),
      count: parseInt(r.count || '0', 10),
    }));
  }

  // ============= Client Analytics =============

  async getClientSummary(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const active = await this.clientRepo.count({
      where: { tenantId, status: 'active' },
    });

    const inactive = await this.clientRepo.count({
      where: { tenantId, status: 'inactive' },
    });

    // New clients in last 30 days
    const newClients = await this.clientRepo.count({
      where: {
        tenantId,
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    return {
      active,
      inactive,
      total: active + inactive,
      newLast30Days: newClients,
    };
  }

  async getClientAcquisition(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);
    const period = query.period || PeriodType.WEEK;

    let dateFormat: string;
    switch (period) {
      case PeriodType.MONTH:
        dateFormat = 'YYYY-MM';
        break;
      case PeriodType.WEEK:
        dateFormat = 'YYYY-IW';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const results = await this.clientRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.createdAt >= :from', { from })
      .andWhere('c.createdAt <= :to', { to })
      .select(`TO_CHAR(c.createdAt, '${dateFormat}')`, 'period')
      .addSelect('COUNT(c.id)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      period: r.period,
      count: parseInt(r.count || '0', 10),
    }));
  }

  async getClientRetention(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Get count of active clients in the last 30 days (clients with completed sessions)
    const activeLast30Result = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.startTime >= :from', { from: thirtyDaysAgo })
      .andWhere('s.status = :status', { status: 'completed' })
      .select('COUNT(DISTINCT s.clientId)', 'count')
      .getRawOne();

    const activeLast30Days = parseInt(activeLast30Result?.count || '0', 10);

    // 2. Get count of active clients in the previous 30 days (60-30 days ago)
    const activePrevious30Result = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.startTime >= :from', { from: sixtyDaysAgo })
      .andWhere('s.startTime < :to', { to: thirtyDaysAgo })
      .andWhere('s.status = :status', { status: 'completed' })
      .select('COUNT(DISTINCT s.clientId)', 'count')
      .getRawOne();

    const activePrevious30Days = parseInt(
      activePrevious30Result?.count || '0',
      10,
    );

    // 3. Get retained clients (active in BOTH periods)
    // Using a subquery approach for "RETAINED" count to avoid fetching IDs
    const retainedResult = await this.sessionRepo
      .createQueryBuilder('s')
      .select('COUNT(DISTINCT s.clientId)', 'count')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.startTime >= :fromLast30', { fromLast30: thirtyDaysAgo })
      .andWhere('s.status = :status', { status: 'completed' })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('prev.clientId')
          .from(Session, 'prev')
          .where('prev.tenantId = :tenantId')
          .andWhere('prev.startTime >= :fromPrev30')
          .andWhere('prev.startTime < :toPrev30')
          .andWhere('prev.status = :status')
          .getQuery();
        return `s.clientId IN ${subQuery}`;
      })
      .setParameters({
        tenantId,
        status: 'completed',
        fromLast30: thirtyDaysAgo,
        fromPrev30: sixtyDaysAgo,
        toPrev30: thirtyDaysAgo,
      })
      .getRawOne();

    const retained = parseInt(retainedResult?.count || '0', 10);

    const retentionRate =
      activePrevious30Days > 0 ? (retained / activePrevious30Days) * 100 : 0;

    return {
      activeLast30Days,
      activePrevious30Days,
      retained,
      retentionRate: Math.round(retentionRate * 10) / 10,
    };
  }

  // ============= Coach Analytics =============

  async getCoachPerformance(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    const results = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.coach', 'c')
      .leftJoin('c.user', 'u')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.startTime >= :from', { from })
      .andWhere('s.startTime <= :to', { to })
      .andWhere('s.status = :status', { status: 'completed' })
      .select('c.id', 'coachId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .groupBy('c.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .orderBy('"sessionCount"', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      coachId: r.coachId,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      sessionCount: parseInt(r.sessionCount || '0', 10),
    }));
  }

  async getCoachRatings(tenantId: string) {
    const results = await this.reviewRepo
      .createQueryBuilder('r')
      .leftJoin('r.session', 's')
      .leftJoin('s.coach', 'c')
      .leftJoin('c.user', 'u')
      .where('s.tenantId = :tenantId', { tenantId })
      .select('c.id', 'coachId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(r.id)', 'reviewCount')
      .groupBy('c.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .orderBy('avgRating', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      coachId: r.coachId,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      avgRating: parseFloat(r.avgRating || '0').toFixed(1),
      reviewCount: parseInt(r.reviewCount || '0', 10),
    }));
  }

  // ============= Operational Analytics =============

  async getRoomUtilization(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    // Get all rooms
    const rooms = await this.roomRepo.find({ where: { tenantId } });

    // Get session counts per room
    const sessionCounts = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.startTime >= :from', { from })
      .andWhere('s.startTime <= :to', { to })
      .select('s.roomId', 'roomId')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .groupBy('s.roomId')
      .getRawMany();

    const sessionMap = new Map(
      sessionCounts.map((r) => [r.roomId, parseInt(r.sessionCount || '0', 10)]),
    );

    // Calculate total possible slots (8 hours/day * days in range)
    const days = Math.ceil(
      (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000),
    );
    const maxSlotsPerRoom = days * 8; // Assume 8 sessions max per day

    return rooms.map((room) => {
      const sessions = sessionMap.get(room.id) || 0;
      const utilization =
        maxSlotsPerRoom > 0 ? (sessions / maxSlotsPerRoom) * 100 : 0;
      return {
        roomId: room.id,
        roomName: room.name,
        sessionCount: sessions,
        utilizationPercent: Math.round(utilization * 10) / 10,
      };
    });
  }

  async getDeviceUtilization(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    const devices = await this.deviceRepo.find({ where: { tenantId } });

    const sessionCounts = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.startTime >= :from', { from })
      .andWhere('s.startTime <= :to', { to })
      .andWhere('s.emsDeviceId IS NOT NULL')
      .select('s.emsDeviceId', 'deviceId')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .groupBy('s.emsDeviceId')
      .getRawMany();

    const sessionMap = new Map(
      sessionCounts.map((r) => [
        r.deviceId,
        parseInt(r.sessionCount || '0', 10),
      ]),
    );

    const days = Math.ceil(
      (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000),
    );
    const maxSlotsPerDevice = days * 8;

    return devices.map((device) => {
      const sessions = sessionMap.get(device.id) || 0;
      const utilization =
        maxSlotsPerDevice > 0 ? (sessions / maxSlotsPerDevice) * 100 : 0;
      return {
        deviceId: device.id,
        deviceName: device.label,
        sessionCount: sessions,
        utilizationPercent: Math.round(utilization * 10) / 10,
      };
    });
  }

  async getPeakHours(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    const results = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.startTime >= :from', { from })
      .andWhere('s.startTime <= :to', { to })
      .select('EXTRACT(HOUR FROM s.startTime)', 'hour')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .groupBy('hour')
      .orderBy('sessionCount', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      hour: parseInt(r.hour || '0', 10),
      sessionCount: parseInt(r.sessionCount || '0', 10),
    }));
  }

  // ============= Waiting List Analytics =============

  async getWaitingListStats(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    const total = await this.waitingListRepo.count({
      where: {
        tenantId,
        createdAt: Between(from, to),
      },
    });

    const converted = await this.waitingListRepo.count({
      where: {
        tenantId,
        status: WaitingListStatus.BOOKED,
        createdAt: Between(from, to),
      },
    });

    const expired = await this.waitingListRepo.count({
      where: {
        tenantId,
        status: WaitingListStatus.CANCELLED,
        createdAt: Between(from, to),
      },
    });

    const pending = await this.waitingListRepo.count({
      where: {
        tenantId,
        status: WaitingListStatus.PENDING,
      },
    });

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      converted,
      expired,
      pending,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }

  // ============= Financial Analytics =============

  async getCashFlow(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);
    const period = query.period || PeriodType.WEEK;

    let dateFormat: string;
    switch (period) {
      case PeriodType.MONTH:
        dateFormat = 'YYYY-MM';
        break;
      case PeriodType.WEEK:
        dateFormat = 'YYYY-IW';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const results = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt >= :from', { from })
      .andWhere('cp.paidAt <= :to', { to })
      .andWhere('cp.paidAt IS NOT NULL')
      .select(`TO_CHAR(cp.paidAt, '${dateFormat}')`, 'period')
      .addSelect('COALESCE(SUM(p.price), 0)', 'amount')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      period: r.period,
      amount: parseFloat(r.amount || '0'),
    }));
  }

  async getOutstandingPayments(tenantId: string) {
    const results = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .leftJoin('cp.client', 'c')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt IS NULL')
      .select('cp.id', 'id')
      .addSelect('c.firstName', 'clientFirstName')
      .addSelect('c.lastName', 'clientLastName')
      .addSelect('p.name', 'packageName')
      .addSelect('p.price', 'amount')
      .addSelect('cp.purchaseDate', 'purchaseDate')
      .getRawMany();

    return results.map((r) => ({
      id: r.id,
      clientName: `${r.clientFirstName || ''} ${r.clientLastName || ''}`.trim(),
      packageName: r.packageName,
      amount: parseFloat(r.amount || '0'),
      purchaseDate: r.purchaseDate,
    }));
  }

  // ============= Session Analytics =============

  async getSessionStats(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    const completed = await this.sessionRepo.count({
      where: { tenantId, status: 'completed', startTime: Between(from, to) },
    });

    const cancelled = await this.sessionRepo.count({
      where: { tenantId, status: 'cancelled', startTime: Between(from, to) },
    });

    const noShow = await this.sessionRepo.count({
      where: { tenantId, status: 'no_show', startTime: Between(from, to) },
    });

    const scheduled = await this.sessionRepo.count({
      where: {
        tenantId,
        status: 'scheduled',
        startTime: MoreThanOrEqual(new Date()),
      },
    });

    const total = completed + cancelled + noShow;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      completed,
      cancelled,
      noShow,
      scheduled,
      total,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }

  // ============= Lead Analytics =============

  async getLeadAnalytics(tenantId: string, query: DateRangeQueryDto) {
    const { from, to } = this.getDateRange(query);

    // 1. Total Leads
    const total = await this.leadRepo.count({
      where: {
        tenantId, // Filter by tenant
        createdAt: Between(from, to),
      },
    });

    // 2. Converted Leads
    const converted = await this.leadRepo.count({
      where: {
        tenantId, // Filter by tenant
        status: 'converted' as any,
        createdAt: Between(from, to),
      },
    });

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    // 3. Source Breakdown
    const sourceBreakdown = await this.leadRepo
      .createQueryBuilder('lead')
      .select('lead.source', 'source')
      .addSelect('COUNT(lead.id)', 'count')
      .where('lead.tenantId = :tenantId', { tenantId })
      .andWhere('lead.created_at >= :from', { from })
      .andWhere('lead.created_at <= :to', { to })
      .groupBy('lead.source')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total,
      converted,
      conversionRate: Math.round(conversionRate * 10) / 10,
      sources: sourceBreakdown.map((s) => ({
        source: s.source || 'Unknown',
        count: parseInt(s.count || '0', 10),
      })),
    };
  }

  // ============= Predictive Analytics =============

  async getRevenueForecast(tenantId: string) {
    // 1. Get Monthly Revenue for last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Start of 6th month back

    const results = await this.clientPackageRepo
      .createQueryBuilder('cp')
      .leftJoin('cp.package', 'p')
      .where('cp.tenantId = :tenantId', { tenantId })
      .andWhere('cp.paidAt >= :from', { from: sixMonthsAgo })
      .andWhere('cp.paidAt IS NOT NULL')
      .select("TO_CHAR(cp.paidAt, 'YYYY-MM')", 'period')
      .addSelect('COALESCE(SUM(p.price), 0)', 'revenue')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    const dataPoints = results.map((r, index) => ({
      x: index, // Time step (0, 1, 2...)
      y: parseFloat(r.revenue || '0'),
      period: r.period,
    }));

    // Fill in missing months with 0 if needed?
    // Ideally we should have continuous data. For simplicity, we use what we have.

    // 2. Linear Regression (Least Squares)
    // y = mx + b
    // m = (n*Sum(xy) - Sum(x)*Sum(y)) / (n*Sum(x^2) - (Sum(x))^2)
    // b = (Sum(y) - m*Sum(x)) / n

    const n = dataPoints.length;
    if (n < 2) {
      return {
        forecast: 0,
        trend: 'insufficient_data',
        confidence: 'low',
      };
    }

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    for (const point of dataPoints) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next month (x = n)
    const nextMonthX = n;
    const predictedRevenue = slope * nextMonthX + intercept;

    // Format next month string
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextPeriod = nextMonthDate.toISOString().slice(0, 7); // YYYY-MM

    return {
      period: nextPeriod,
      forecast: Math.max(0, Math.round(predictedRevenue * 100) / 100), // No negative revenue
      trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
      growthRate:
        dataPoints.length > 0 && dataPoints[dataPoints.length - 1].y > 0
          ? ((predictedRevenue - dataPoints[dataPoints.length - 1].y) /
              dataPoints[dataPoints.length - 1].y) *
            100
          : 0,
      history: dataPoints,
    };
  }
}
