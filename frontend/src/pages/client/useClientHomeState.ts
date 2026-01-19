import { useState, useEffect, useCallback } from 'react';
import { clientPortalService, type ClientDashboardData } from '../../services/client-portal.service';
import { clientNotificationsService, type DashboardNotification } from '../../services/client-notifications.service';

export interface WaitingListEntry {
    id: string;
    preferredDate: string | null;
    preferredTimeSlot: string | null;
    status: 'pending' | 'approved' | 'notified' | 'booked' | 'cancelled';
    studio: { id: string; name: string } | null;
    createdAt: string;
    notifiedAt: string | null;
}

export function useClientHomeState() {
    const [data, setData] = useState<ClientDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [dashboardResult, waitingListResult, notificationsResult] = await Promise.all([
                    clientPortalService.getDashboard(),
                    clientPortalService.getMyWaitingList(),
                    clientNotificationsService.getAll()
                ]);
                setData(dashboardResult);
                setWaitingList(waitingListResult.filter((e: WaitingListEntry) =>
                    e.status !== 'cancelled' && e.status !== 'booked'
                ));
                setNotifications(notificationsResult);
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const handleCancelWaitingList = useCallback(async (id: string) => {
        if (!confirm('Cancel this waiting list request?')) return;
        try {
            await clientPortalService.cancelWaitingListEntry(id);
            setWaitingList(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to cancel');
        }
    }, []);

    const getGreeting = useCallback(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    // Filter high/medium priority notifications
    const importantNotifications = notifications.filter(
        n => n.priority === 'high' || n.priority === 'medium'
    );

    return {
        data,
        loading,
        error,
        waitingList,
        notifications,
        importantNotifications,
        handleCancelWaitingList,
        getGreeting
    };
}
