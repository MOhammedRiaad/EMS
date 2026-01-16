const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Review {
    id: string;
    sessionId: string;
    clientId: string;
    coachId: string;
    rating: number;
    comments: string | null;
    createdAt: string;
}

export interface CoachStats {
    averageRating: number;
    totalReviews: number;
}

export const reviewsService = {
    async submitReview(sessionId: string, rating: number, comments?: string): Promise<Review> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId, rating, comments })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to submit review' }));
            throw new Error(error.message || 'Failed to submit review');
        }
        return response.json();
    },

    async getSessionReview(sessionId: string): Promise<Review | null> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reviews/session/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 404 || !response.ok) return null;
        return response.json();
    },

    async getCoachReviews(coachId: string, minRating?: number): Promise<Review[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (minRating) params.append('minRating', minRating.toString());

        const response = await fetch(`${API_URL}/reviews/coach/${coachId}?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch coach reviews');
        return response.json();
    },

    async getCoachStats(coachId: string): Promise<CoachStats> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reviews/coach/${coachId}/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch coach stats');
        return response.json();
    }
};
