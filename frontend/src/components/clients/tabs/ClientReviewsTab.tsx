import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { authenticatedFetch } from '../../../services/api';

interface Review {
    id: string;
    rating: number;
    comment: string;
    sessionId?: string;
    coachId?: string;
    coachName?: string;
    createdAt: string;
}

interface ClientReviewsTabProps {
    clientId: string;
}

const ClientReviewsTab: React.FC<ClientReviewsTabProps> = ({ clientId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, [clientId]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const data = await authenticatedFetch(`/reviews?clientId=${clientId}`);
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load reviews:', err);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={16}
                        className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    const getAverageRating = () => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        return (total / reviews.length).toFixed(1);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Reviews Yet</h3>
                <p className="text-gray-500 dark:text-gray-400">This client hasn't submitted any reviews yet.</p>
            </div>
        );
    }

    const positiveCount = reviews.filter(r => r.rating >= 4).length;
    const negativeCount = reviews.filter(r => r.rating <= 2).length;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Average Rating</span>
                        <Star className="text-yellow-400 fill-yellow-400" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                        {getAverageRating()} <span className="text-sm text-gray-400">/ 5</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Positive</span>
                        <ThumbsUp className="text-green-500" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-green-600 mt-2">{positiveCount}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Needs Attention</span>
                        <ThumbsDown className="text-red-500" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-red-600 mt-2">{negativeCount}</div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <MessageSquare size={18} />
                        Review History ({reviews.length} reviews)
                    </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reviews.map(review => (
                        <div key={review.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    {renderStars(review.rating)}
                                    {review.coachName && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                            for {review.coachName}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {review.comment && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md mt-2">
                                    "{review.comment}"
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientReviewsTab;
