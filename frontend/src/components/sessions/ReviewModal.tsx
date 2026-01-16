import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Star } from 'lucide-react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comments: string) => Promise<void>;
    sessionInfo?: {
        coachName: string;
        date: string;
    };
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, sessionInfo }) => {
    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(rating, comments);
            setRating(5);
            setComments('');
            onClose();
        } catch (error) {
            console.error('Failed to submit review', error);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        return [1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                }}
            >
                <Star
                    size={32}
                    fill={(hoveredRating || rating) >= star ? '#f59e0b' : 'none'}
                    color={(hoveredRating || rating) >= star ? '#f59e0b' : 'var(--color-text-secondary)'}
                />
            </button>
        ));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rate Your Session">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {sessionInfo && (
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Coach: <strong style={{ color: 'var(--color-text-primary)' }}>{sessionInfo.coachName}</strong>
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                            Date: {sessionInfo.date}
                        </p>
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        How would you rate your session?
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {renderStars()}
                        <span style={{ marginLeft: '1rem', fontSize: '1.25rem', fontWeight: 600, color: '#f59e0b' }}>
                            {rating}/5
                        </span>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        Comments (Optional)
                    </label>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Share your experience..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                            resize: 'vertical',
                            minHeight: '100px',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        style={{
                            padding: '0.5rem 1rem',
                            color: 'var(--color-text-secondary)',
                            opacity: submitting ? 0.5 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--border-radius-md)',
                            opacity: submitting ? 0.6 : 1,
                            fontWeight: 500
                        }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ReviewModal;
