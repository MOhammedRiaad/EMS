import React from 'react';
import { Calendar, Clock, X, MapPin } from 'lucide-react';
import type { Session } from './useClientScheduleState';

// ============================================================================
// FilterTabs
// ============================================================================

export interface FilterTabsProps {
    filter: 'upcoming' | 'past';
    setFilter: (filter: 'upcoming' | 'past') => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ filter, setFilter }) => (
    <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-lg">
        <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'upcoming' ? 'bg-white dark:bg-slate-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setFilter('upcoming')}
        >
            Upcoming
        </button>
        <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'past' ? 'bg-white dark:bg-slate-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setFilter('past')}
        >
            History
        </button>
    </div>
);

// ============================================================================
// SessionCard
// ============================================================================

export interface SessionCardProps {
    session: Session;
    filter: 'upcoming' | 'past';
    onCancel: (id: string) => void;
    onReview: (id: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, filter, onCancel, onReview }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden ${session.status === 'cancelled' ? 'opacity-75 bg-gray-50 dark:bg-slate-800' : ''}`}>
        {session.status === 'cancelled' && (
            <div className="absolute top-0 right-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-bl-lg font-medium">
                Cancelled
            </div>
        )}

        <div className="flex items-start space-x-3">
            <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg ${session.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                <span className="text-xs font-bold uppercase">{new Date(session.startTime).toLocaleString('default', { month: 'short' })}</span>
                <span className="text-xl font-bold">{new Date(session.startTime).getDate()}</span>
            </div>

            <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-white">EMS Training</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mt-1">
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
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                <button
                    onClick={() => onCancel(session.id)}
                    className="text-red-600 text-sm font-medium flex items-center hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <X size={14} className="mr-1" /> Cancel
                </button>
            </div>
        )}

        {filter === 'past' && session.status === 'completed' && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                {session.review ? (
                    <div className="text-yellow-500 text-sm font-medium flex items-center">
                        <span className="mr-1">★</span> {session.review.rating}/5 Reviewed
                    </div>
                ) : (
                    <button
                        onClick={() => onReview(session.id)}
                        className="text-blue-600 text-sm font-medium flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <span className="mr-1">★</span> Leave Review
                    </button>
                )}
            </div>
        )}
    </div>
);

// ============================================================================
// EmptyState
// ============================================================================

export interface EmptyStateProps {
    filter: 'upcoming' | 'past';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ filter }) => (
    <div className="text-center py-10 text-gray-400">
        <Calendar size={48} className="mx-auto mb-2 opacity-20" />
        <p>No {filter} sessions found</p>
    </div>
);

// ============================================================================
// ReviewModal
// ============================================================================

export interface ReviewModalProps {
    rating: number;
    setRating: (rating: number) => void;
    comment: string;
    setComment: (comment: string) => void;
    submitting: boolean;
    onSubmit: () => void;
    onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    rating, setRating, comment, setComment, submitting, onSubmit, onClose
}) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">How was your session?</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
            </div>

            <div className="flex justify-center space-x-2 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    >
                        ★
                    </button>
                ))}
            </div>

            <textarea
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Share your experience (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />

            <button
                onClick={onSubmit}
                disabled={submitting || rating === 0}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
                {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
        </div>
    </div>
);
