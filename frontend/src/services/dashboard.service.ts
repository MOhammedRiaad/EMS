import { authenticatedFetch } from './api';

export interface DashboardStats {
    activeClients: number;
    activeCoaches: number;
    todaySessions: number;
    revenue: number;
}

export interface DashboardNotification {
    id: string;
    type: 'session_today' | 'session_upcoming' | 'package_expiring' | 'package_low' | 'waitlist_update' | 'time_off_request';
    title: string;
    message: string;
    link?: string;
    priority: 'high' | 'medium' | 'low';
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        return authenticatedFetch('/dashboard/stats');
    },

    async getNotifications(): Promise<DashboardNotification[]> {
        return authenticatedFetch('/notifications/dashboard');
    }
};
