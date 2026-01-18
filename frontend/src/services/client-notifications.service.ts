import { authenticatedFetch } from './api';

export interface DashboardNotification {
    id: string;
    type: 'session_today' | 'session_upcoming' | 'package_expiring' | 'package_low' | 'waitlist_update';
    title: string;
    message: string;
    link?: string;
    priority: 'high' | 'medium' | 'low';
}

export const clientNotificationsService = {
    getAll: async (): Promise<DashboardNotification[]> => {
        return authenticatedFetch('/notifications/client');
    }
};
