import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Star } from 'lucide-react';
import { reviewsService, type Review } from '../../services/reviews.service';

const Reviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const data = await reviewsService.getCoachReviews('all'); // Simplified - would need proper admin endpoint
            setReviews(data);
        } catch (err) {
            console.error('Failed to fetch reviews', err);
            setReviews([]); // Fallback to empty array
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader title="Reviews" />

            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.5rem',
                border: '1px solid var(--border-color)'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                        Loading reviews...
                    </div>
                ) : reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                        No reviews yet
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={16}
                                                fill={star <= review.rating ? 'var(--color-warning)' : 'none'}
                                                stroke={star <= review.rating ? 'var(--color-warning)' : 'var(--color-text-muted)'}
                                            />
                                        ))}
                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {review.rating}/5
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {review.comments && (
                                    <p style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                                        {review.comments}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reviews;
