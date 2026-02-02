import { useState, useEffect } from 'react';
import { Loader2, Check, X, Calendar, Clock, User } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { authenticatedFetch } from '../../services/api';

type TimeOffStatus = 'pending' | 'approved' | 'rejected';

interface TimeOffRequest {
    id: string;
    coachId: string;
    startDate: string;
    endDate: string;
    notes: string | null;
    status: TimeOffStatus;
    requestedAt: string;
    reviewedAt: string | null;
    coach: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
        };
    };
}

const TimeOffRequests = () => {
    const [requests, setRequests] = useState<TimeOffRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<TimeOffStatus | 'all'>('pending');

    useEffect(() => {
        loadRequests();
    }, [statusFilter]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
            const data = await authenticatedFetch(`/coaches/time-off/requests${query}`);
            setRequests(data);
        } catch (err) {
            console.error('Failed to load time-off requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        setProcessing(requestId);
        try {
            await authenticatedFetch(`/coaches/time-off/${requestId}/approve`, { method: 'PATCH' });
            await loadRequests();
        } catch (err) {
            console.error('Failed to approve request:', err);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setProcessing(requestId);
        try {
            await authenticatedFetch(`/coaches/time-off/${requestId}/reject`, { method: 'PATCH' });
            await loadRequests();
        } catch (err) {
            console.error('Failed to reject request:', err);
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    const getStatusBadge = (status: TimeOffStatus) => {
        const styles: Record<TimeOffStatus, { bg: string; text: string }> = {
            pending: { bg: 'rgba(245, 158, 11, 0.1)', text: 'rgb(245, 158, 11)' },
            approved: { bg: 'rgba(16, 185, 129, 0.1)', text: 'rgb(16, 185, 129)' },
            rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgb(239, 68, 68)' },
        };
        const s = styles[status];
        return (
            <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: s.bg,
                color: s.text,
                textTransform: 'capitalize'
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <PageHeader
                title="Time-Off Requests"
                description="Review and manage coach time-off requests"
            />

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: statusFilter === status ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                            color: statusFilter === status ? 'white' : 'var(--color-text-primary)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Request List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No {statusFilter !== 'all' ? statusFilter : ''} time-off requests found.
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(request => (
                        <div
                            key={request.id}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User size={18} className="text-blue-600" />
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {request.coach?.user?.firstName} {request.coach?.user?.lastName}
                                        </span>
                                        {getStatusBadge(request.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {formatDate(request.startDate)} — {formatDate(request.endDate)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            Requested {formatDate(request.requestedAt)}
                                        </div>
                                    </div>
                                    {request.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 p-2 rounded-md">
                                            {request.notes}
                                        </p>
                                    )}
                                </div>

                                {request.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            disabled={processing === request.id}
                                            className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {processing === request.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Check size={14} />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            disabled={processing === request.id}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {processing === request.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <X size={14} />
                                            )}
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TimeOffRequests;
