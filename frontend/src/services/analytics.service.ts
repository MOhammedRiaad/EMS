import { api } from './api';

// Types
export interface RevenueSummary {
    total: number;
    mtd: number;
    ytd: number;
    lastMonth: number;
    growthPercent: number;
}

export interface RevenueByPeriod {
    period: string;
    revenue: number;
    count: number;
}

export interface RevenueByPackage {
    packageId: string;
    packageName: string;
    revenue: number;
    count: number;
}

export interface ClientSummary {
    active: number;
    inactive: number;
    total: number;
    newLast30Days: number;
}

export interface ClientAcquisition {
    period: string;
    count: number;
}

export interface ClientRetention {
    activeLast30Days: number;
    activePrevious30Days: number;
    retained: number;
    retentionRate: number;
}

export interface CoachPerformance {
    coachId: string;
    name: string;
    sessionCount: number;
}

export interface CoachRating {
    coachId: string;
    name: string;
    avgRating: string;
    reviewCount: number;
}

export interface Utilization {
    id: string;
    name: string;
    sessionCount: number;
    utilizationPercent: number;
}

export interface PeakHour {
    hour: number;
    sessionCount: number;
}

export interface SessionStats {
    completed: number;
    cancelled: number;
    noShow: number;
    scheduled: number;
    total: number;
    completionRate: number;
}

export interface CashFlow {
    period: string;
    amount: number;
}

export interface OutstandingPayment {
    id: string;
    clientName: string;
    packageName: string;
    amount: number;
    purchaseDate: string;
}

export interface WaitingListStats {
    total: number;
    converted: number;
    expired: number;
    pending: number;
    conversionRate: number;
}

export interface DateRangeQuery {
    from?: string;
    to?: string;
    period?: 'day' | 'week' | 'month';
}

// Service
class AnalyticsService {
    private buildQuery(params: DateRangeQuery = {}): string {
        const query = new URLSearchParams();
        if (params.from) query.append('from', params.from);
        if (params.to) query.append('to', params.to);
        if (params.period) query.append('period', params.period);
        return query.toString() ? `?${query.toString()}` : '';
    }

    // Revenue
    async getRevenueSummary(): Promise<RevenueSummary> {
        return api.get('/analytics/revenue/summary');
    }

    async getRevenueByPeriod(params?: DateRangeQuery): Promise<RevenueByPeriod[]> {
        return api.get(`/analytics/revenue/by-period${this.buildQuery(params)}`);
    }

    async getRevenueByPackage(params?: DateRangeQuery): Promise<RevenueByPackage[]> {
        return api.get(`/analytics/revenue/by-package${this.buildQuery(params)}`);
    }

    // Clients
    async getClientSummary(): Promise<ClientSummary> {
        return api.get('/analytics/clients/summary');
    }

    async getClientAcquisition(params?: DateRangeQuery): Promise<ClientAcquisition[]> {
        return api.get(`/analytics/clients/acquisition${this.buildQuery(params)}`);
    }

    async getClientRetention(): Promise<ClientRetention> {
        return api.get('/analytics/clients/retention');
    }

    // Coaches
    async getCoachPerformance(params?: DateRangeQuery): Promise<CoachPerformance[]> {
        return api.get(`/analytics/coaches/performance${this.buildQuery(params)}`);
    }

    async getCoachRatings(): Promise<CoachRating[]> {
        return api.get('/analytics/coaches/ratings');
    }

    // Operations
    async getRoomUtilization(params?: DateRangeQuery): Promise<Utilization[]> {
        return api.get(`/analytics/operations/room-utilization${this.buildQuery(params)}`);
    }

    async getDeviceUtilization(params?: DateRangeQuery): Promise<Utilization[]> {
        return api.get(`/analytics/operations/device-utilization${this.buildQuery(params)}`);
    }

    async getPeakHours(params?: DateRangeQuery): Promise<PeakHour[]> {
        return api.get(`/analytics/operations/peak-hours${this.buildQuery(params)}`);
    }

    // Sessions
    async getSessionStats(params?: DateRangeQuery): Promise<SessionStats> {
        return api.get(`/analytics/sessions/stats${this.buildQuery(params)}`);
    }

    // Financial
    async getCashFlow(params?: DateRangeQuery): Promise<CashFlow[]> {
        return api.get(`/analytics/financial/cash-flow${this.buildQuery(params)}`);
    }

    async getOutstandingPayments(): Promise<OutstandingPayment[]> {
        return api.get('/analytics/financial/outstanding');
    }

    // Waiting List
    async getWaitingListStats(params?: DateRangeQuery): Promise<WaitingListStats> {
        return api.get(`/analytics/waiting-list/stats${this.buildQuery(params)}`);
    }
}

export const analyticsService = new AnalyticsService();
