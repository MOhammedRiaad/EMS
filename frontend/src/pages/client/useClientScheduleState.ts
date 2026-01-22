import { useState, useEffect, useCallback } from 'react';
import { clientPortalService } from '../../services/client-portal.service';

export interface Session {
    id: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    room?: { name: string };
    review?: { rating: number };
}

export interface HistoryFilter {
    status: 'all' | 'completed' | 'cancelled';
    month: string; // 'YYYY-MM' or 'all'
}

export function useClientScheduleState() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    // Calendar State
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // History Filter State
    const [historyFilter, setHistoryFilter] = useState<HistoryFilter>({ status: 'all', month: 'all' });

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const loadSessions = useCallback(async () => {
        setLoading(true);
        try {
            const result = await clientPortalService.getSessions();
            setSessions(result);
        } catch (err: any) {
            setError(err.message || 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const openReviewModal = useCallback((sessionId: string) => {
        setSelectedSessionId(sessionId);
        setReviewRating(0);
        setReviewComment('');
        setShowReviewModal(true);
    }, []);

    const closeReviewModal = useCallback(() => {
        setShowReviewModal(false);
        setSelectedSessionId(null);
    }, []);

    const submitReview = useCallback(async () => {
        if (!selectedSessionId || reviewRating === 0) return;

        setReviewSubmitting(true);
        try {
            await clientPortalService.createReview({
                sessionId: selectedSessionId,
                rating: reviewRating,
                comments: reviewComment
            });
            alert('Review submitted! Thank you.');
            closeReviewModal();
            loadSessions();
        } catch (err: any) {
            alert(err.message || 'Failed to submit review');
        } finally {
            setReviewSubmitting(false);
        }
    }, [selectedSessionId, reviewRating, reviewComment, closeReviewModal, loadSessions]);

    const handleCancel = useCallback(async (sessionId: string) => {
        if (!confirm('Are you sure you want to cancel this session?')) return;

        try {
            await clientPortalService.cancelSession(sessionId, 'Client cancelled via portal');
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled' as const } : s));
            alert('Session cancelled successfully.');
        } catch (err: any) {
            alert(err.message || 'Failed to cancel session');
        }
    }, []);

    // Filter Logic
    const filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        const isPast = sessionDate < new Date() || session.status === 'completed';

        if (filter === 'upcoming') {
            if (isPast) return false;
            // Additional filtering for calendar view?
            // If user selects a date on calendar, filter by that date.
            // If not, show all upcoming? Or just show the calendar?
            // "Select date to filter the session list below"
            if (selectedDate) {
                return sessionDate.toDateString() === selectedDate.toDateString();
            }
            return true;
        } else {
            // History Tab
            if (!isPast) return false;

            // Apply History Filters
            if (historyFilter.status !== 'all' && session.status !== historyFilter.status) return false;

            if (historyFilter.month !== 'all') {
                const [year, month] = historyFilter.month.split('-').map(Number);
                if (sessionDate.getFullYear() !== year || sessionDate.getMonth() + 1 !== month) return false;
            }

            return true;
        }
    }).sort((a, b) => {
        return filter === 'upcoming'
            ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            : new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    const handleCalendarMonthChange = useCallback((increment: number) => {
        setCalendarMonth(prev => {
            const next = new Date(prev);
            next.setMonth(next.getMonth() + increment);
            return next;
        });
    }, []);

    return {
        // Data
        sessions,
        filteredSessions,

        // State
        loading,
        error,
        filter,
        setFilter,

        // Calendar
        calendarMonth,
        handleCalendarMonthChange,
        selectedDate,
        setSelectedDate,

        // History Filter
        historyFilter,
        setHistoryFilter,

        // Review modal
        showReviewModal,
        selectedSessionId,
        reviewRating,
        setReviewRating,
        reviewComment,
        setReviewComment,
        reviewSubmitting,

        // Handlers
        loadSessions,
        handleCancel,
        openReviewModal,
        closeReviewModal,
        submitReview
    };
}
