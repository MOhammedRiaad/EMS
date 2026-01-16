import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { reviewsService, type Review, type CoachStats } from '../../services/reviews.service';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { Star, TrendingUp, MessageSquare } from 'lucide-react';

const CoachPerformance: React.FC = () => {
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [selectedCoach, setSelectedCoach] = useState<CoachDisplay | null>(null);
    const [stats, setStats] = useState<CoachStats | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCoaches();
    }, []);

    const fetchCoaches = async () => {
        try {
            const coachesData = await coachesService.getAll();
            setCoaches(coachesData);
        } catch (error) {
            console.error('Failed to fetch coaches', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCoachSelect = async (coach: CoachDisplay) => {
        setSelectedCoach(coach);
        try {
            const [statsData, reviewsData] = await Promise.all([
                reviewsService.getCoachStats(coach.id),
                reviewsService.getCoachReviews(coach.id)
            ]);
            setStats(statsData);
            setReviews(reviewsData);
        } catch (error) {
            console.error('Failed to fetch coach data', error);
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? '#f59e0b' : 'none'}
                color={i < rating ? '#f59e0b' : 'var(--color-text-secondary)'}
            />
        ));
    };

    return (
        <div>
            <PageHeader
                title="Coach Performance"
                description="View coach ratings and client reviews"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Coaches List */}
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', padding: '1rem', maxHeight: '700px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Coaches</h3>
                    {coaches.map(coach => (
                        <div
                            key={coach.id}
                            onClick={() => handleCoachSelect(coach)}
                            style={{
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: `1px solid ${selectedCoach?.id === coach.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                backgroundColor: selectedCoach?.id === coach.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-bg-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 500 }}>{coach.firstName} {coach.lastName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                {coach.specializations?.join(', ') || 'No specializations'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coach Details & Reviews */}
                <div>
                    {selectedCoach ? (
                        <>
                            {/* Stats Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Star size={24} color="#f59e0b" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Average Rating</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                                {stats?.averageRating.toFixed(1) || '0.0'}
                                                <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginLeft: '0.25rem' }}>/5</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MessageSquare size={24} color="#3b82f6" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Reviews</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{stats?.totalReviews || 0}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Client Reviews</h3>
                                {reviews.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>No reviews yet</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {reviews.map(review => (
                                            <div key={review.id} style={{ padding: '1rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        {renderStars(review.rating)}
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {review.comments && (
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                                                        "{review.comments}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
                            <TrendingUp size={48} color="var(--color-text-secondary)" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Select a coach to view performance</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoachPerformance;
