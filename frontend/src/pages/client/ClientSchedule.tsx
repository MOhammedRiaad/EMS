import { useState, useEffect } from 'react';
import { clientPortalService } from '../../services/client-portal.service';
import { Calendar, Clock, X, AlertCircle, Plus, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientSchedule = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const openReviewModal = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setReviewRating(0);
        setReviewComment('');
        setShowReviewModal(true);
    };

    const closeReviewModal = () => {
        setShowReviewModal(false);
        setSelectedSessionId(null);
    };

    const submitReview = async () => {
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
            // Reload sessions to update "Reviewed" status
            loadSessions();
        } catch (err: any) {
            alert(err.message || 'Failed to submit review');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const loadSessions = async () => {
        setLoading(true);
        try {
            const result = await clientPortalService.getSessions(); // Fetches all, we filter client-side or add params
            setSessions(result);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleCancel = async (sessionId: string) => {
        if (!confirm('Are you sure you want to cancel this session?')) return;

        try {
            await clientPortalService.cancelSession(sessionId, 'Client cancelled via portal');
            // Optimistic update or reload
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled' } : s));
            alert('Session cancelled successfully.');
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(err.message || 'Failed to cancel session');
        }
    };

    const filteredSessions = sessions.filter(session => {
        const isPast = new Date(session.startTime) < new Date() || session.status === 'completed';
        return filter === 'upcoming' ? !isPast : isPast;
    }).sort((a, b) => {
        return filter === 'upcoming'
            ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            : new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    if (loading && sessions.length === 0) return <div className="p-6 text-center text-gray-500">Loading schedule...</div>;

    return (
        <div className="p-4 space-y-4 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">My Schedule</h1>
                <button className="bg-blue-600 text-white p-2 rounded-full shadow-lg" onClick={() => alert('Booking flow coming next!')}>
                    <Plus size={24} />
                </button>
            </header>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${filter === 'upcoming' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    onClick={() => setFilter('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${filter === 'past' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    onClick={() => setFilter('past')}
                >
                    History
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
                    <AlertCircle size={20} className="mr-2" />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                {filteredSessions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                        <p>No {filter} sessions found</p>
                    </div>
                ) : (
                    filteredSessions.map(session => (
                        <div key={session.id} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative overflow-hidden ${session.status === 'cancelled' ? 'opacity-75 bg-gray-50' : ''}`}>
                            {session.status === 'cancelled' && (
                                <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-bl-lg font-medium">
                                    Cancelled
                                </div>
                            )}

                            <div className="flex items-start space-x-3">
                                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg ${session.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <span className="text-xs font-bold uppercase">{new Date(session.startTime).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-xl font-bold">{new Date(session.startTime).getDate()}</span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">EMS Training</h3>
                                    <div className="text-sm text-gray-500 space-y-1 mt-1">
                                        <div className="flex items-center">
                                            <Clock size={14} className="mr-1.5" />
                                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {session.room && (
                                            <div className="flex items-center">
                                                <MapPin size={14} className="mr-1.5" />
                                                {session.room.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {filter === 'upcoming' && session.status === 'scheduled' && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={() => handleCancel(session.id)}
                                        className="text-red-600 text-sm font-medium flex items-center hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <X size={14} className="mr-1" /> Cancel
                                    </button>
                                </div>
                            )}

                            {filter === 'past' && session.status === 'completed' && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                    {session.review ? (
                                        <div className="text-yellow-500 text-sm font-medium flex items-center">
                                            <span className="mr-1">★</span> {session.review.rating}/5 Reviewed
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => openReviewModal(session.id)}
                                            className="text-blue-600 text-sm font-medium flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <span className="mr-1">★</span> Leave Review
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">How was your session?</h3>
                            <button onClick={closeReviewModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex justify-center space-x-2 py-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setReviewRating(star)}
                                    className={`text-3xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-200'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            rows={3}
                            placeholder="Share your experience (optional)..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />

                        <button
                            onClick={submitReview}
                            disabled={reviewSubmitting || reviewRating === 0}
                            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                        >
                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            )}
        </div>

    );
};

export default ClientSchedule;
