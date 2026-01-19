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

export function useClientScheduleState() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

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

    const filteredSessions = sessions.filter(session => {
        const isPast = new Date(session.startTime) < new Date() || session.status === 'completed';
        return filter === 'upcoming' ? !isPast : isPast;
    }).sort((a, b) => {
        return filter === 'upcoming'
            ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            : new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return {
        // Data
        sessions,
        filteredSessions,

        // State
        loading,
        error,
        filter,
        setFilter,

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
