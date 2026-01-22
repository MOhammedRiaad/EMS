const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ClientDashboardData {
    nextSession: any;
    activePackage: any;
}

export interface ClientProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    memberSince: string;
    gender?: 'male' | 'female' | 'other' | 'pnts';
}

export const clientPortalService = {
    async getDashboard(): Promise<ClientDashboardData> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch dashboard');
        return response.json();
    },

    async getSessions(params?: any): Promise<any[]> {
        const token = localStorage.getItem('token');
        const url = new URL(`${API_URL}/client-portal/sessions`);
        if (params) {
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        }

        const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    },



    async getAvailableSlots(date: string, studioId?: string, coachId?: string): Promise<{ time: string; status: 'available' | 'full' }[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ date });
        if (studioId) params.append('studioId', studioId);
        if (coachId) params.append('coachId', coachId);

        const response = await fetch(`${API_URL}/client-portal/slots?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch slots');
        return response.json();
    },

    async getCoaches(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/coaches`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch coaches');
        return response.json();
    },

    async joinWaitingList(data: { studioId?: string; preferredDate: string; preferredTimeSlot: string; notes?: string }): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/waiting-list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to join waiting list');
        }
        return response.json();
    },

    async bookSession(data: any): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to book session');
        }
        return response.json();
    },

    async validateRecurrence(data: any): Promise<{ validSessions: string[], conflicts: Array<{ date: string, conflict: string }> }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/sessions/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to validate recurrence');
        }
        return response.json();
    },

    async cancelSession(id: string, reason?: string): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/sessions/${id}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ reason })
        });
        if (!response.ok) throw new Error('Failed to cancel session');
        return response.json();
    },

    async createReview(data: { sessionId: string; rating: number; comments: string }): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to submit review');
        }
        return response.json();
    },

    async getProfile(): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    async updateProfile(data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; gender?: 'male' | 'female' | 'other' | 'pnts' }): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to update profile');
        }
        return response.json();
    },

    async getMyWaitingList(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/waiting-list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch waiting list');
        return response.json();
    },

    async cancelWaitingListEntry(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/waiting-list/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to cancel waiting list entry');
    },

    async getAchievements(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/gamification/achievements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch achievements');
        return response.json();
    },

    async getGoals(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/gamification/goals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch goals');
        return response.json();
    },

    async setGoal(data: { goalType: string; targetValue: number; deadline?: string; notes?: string }): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/gamification/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to set goal');
        return response.json();
    },

    async getLeaderboard(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/gamification/leaderboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        return response.json();
    },

    async getActivityFeed(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/gamification/feed`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch activity feed');
        return response.json();
    },

    async toggleFavoriteCoach(coachId: string): Promise<{ favorited: boolean }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/favorite-coaches/${coachId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to toggle favorite coach');
        return response.json();
    },

    async getFavoriteCoaches(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/client-portal/favorite-coaches`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch favorite coaches');
        return response.json();
    }
};
