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
    avgPrice: number;
    costPerSession: number;
    totalSessions: number;
}

export interface UtilizationHeatmapItem {
    day: string;
    dayIndex: number; // 0-6
    hour: number; // 0-23
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

export interface LeadSource {
    source: string;
    count: number;
}

export interface LeadAnalytics {
    total: number;
    converted: number;
    conversionRate: number;
    sources: LeadSource[];
}

export interface RevenueForecast {
    period: string; // Next month YYYY-MM
    forecast: number;
    trend: 'up' | 'down' | 'flat' | 'insufficient_data';
    growthRate: number;
    history: { x: number; y: number; period: string }[];
    confidence: string;
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
        const response = await api.get<RevenueSummary>('/analytics/revenue/summary');
        return response.data;
    }

    async getRevenueByPeriod(params?: DateRangeQuery): Promise<RevenueByPeriod[]> {
        const response = await api.get<RevenueByPeriod[]>(`/analytics/revenue/by-period${this.buildQuery(params)}`);
        return response.data;
    }

    async getRevenueByPackage(params?: DateRangeQuery): Promise<RevenueByPackage[]> {
        const response = await api.get<RevenueByPackage[]>(`/analytics/revenue/by-package${this.buildQuery(params)}`);
        return response.data;
    }

    // Clients
    async getClientSummary(): Promise<ClientSummary> {
        const response = await api.get<ClientSummary>('/analytics/clients/summary');
        return response.data;
    }

    async getClientAcquisition(params?: DateRangeQuery): Promise<ClientAcquisition[]> {
        const response = await api.get<ClientAcquisition[]>(`/analytics/clients/acquisition${this.buildQuery(params)}`);
        return response.data;
    }

    async getClientRetention(): Promise<ClientRetention> {
        const response = await api.get<ClientRetention>('/analytics/clients/retention');
        return response.data;
    }

    // Coaches
    async getCoachPerformance(params?: DateRangeQuery): Promise<CoachPerformance[]> {
        const response = await api.get<CoachPerformance[]>(`/analytics/coaches/performance${this.buildQuery(params)}`);
        return response.data;
    }

    async getCoachRatings(): Promise<CoachRating[]> {
        const response = await api.get<CoachRating[]>('/analytics/coaches/ratings');
        return response.data;
    }

    // Operations
    async getRoomUtilization(params?: DateRangeQuery): Promise<Utilization[]> {
        const response = await api.get<Utilization[]>(`/analytics/operations/room-utilization${this.buildQuery(params)}`);
        return response.data;
    }

    async getDeviceUtilization(params?: DateRangeQuery): Promise<Utilization[]> {
        const response = await api.get<Utilization[]>(`/analytics/operations/device-utilization${this.buildQuery(params)}`);
        return response.data;
    }

    async getPeakHours(params?: DateRangeQuery): Promise<PeakHour[]> {
        const response = await api.get<PeakHour[]>(`/analytics/operations/peak-hours${this.buildQuery(params)}`);
        return response.data;
    }

    async getUtilizationHeatmap(params?: DateRangeQuery): Promise<UtilizationHeatmapItem[]> {
        const response = await api.get<UtilizationHeatmapItem[]>(`/analytics/operations/heatmap${this.buildQuery(params)}`);
        return response.data;
    }

    // Sessions
    async getSessionStats(params?: DateRangeQuery): Promise<SessionStats> {
        const response = await api.get<SessionStats>(`/analytics/sessions/stats${this.buildQuery(params)}`);
        return response.data;
    }

    // Financial
    async getCashFlow(params?: DateRangeQuery): Promise<CashFlow[]> {
        const response = await api.get<CashFlow[]>(`/analytics/financial/cash-flow${this.buildQuery(params)}`);
        return response.data;
    }

    async getOutstandingPayments(): Promise<OutstandingPayment[]> {
        const response = await api.get<OutstandingPayment[]>('/analytics/financial/outstanding');
        return response.data;
    }

    // Waiting List
    async getWaitingListStats(params?: DateRangeQuery): Promise<WaitingListStats> {
        const response = await api.get<WaitingListStats>(`/analytics/waiting-list/stats${this.buildQuery(params)}`);
        return response.data;
    }

    // Leads
    async getLeadAnalytics(params?: DateRangeQuery): Promise<LeadAnalytics> {
        const response = await api.get<LeadAnalytics>(`/analytics/leads/analytics${this.buildQuery(params)}`);
        return response.data;
    }

    // Predictive
    async getRevenueForecast(): Promise<RevenueForecast> {
        const response = await api.get<RevenueForecast>('/analytics/predictive/revenue-forecast');
        return response.data;
    }
}

export const analyticsService = new AnalyticsService();
