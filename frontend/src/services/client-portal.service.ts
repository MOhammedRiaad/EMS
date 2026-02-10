import { authenticatedFetch } from './api';

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
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    healthGoals?: Array<{ id: string; goal: string; completed: boolean; targetDate?: string }>;
    medicalHistory?: { allergies: string[]; injuries: string[]; conditions: string[]; custom?: any };
    healthNotes?: string;
    isTwoFactorEnabled?: boolean;
}

export const clientPortalService = {
    async getDashboard(): Promise<ClientDashboardData> {
        return authenticatedFetch('/client-portal/dashboard');
    },

    async getSessions(params?: any): Promise<any[]> {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return authenticatedFetch(`/client-portal/sessions${query}`);
    },



    async getAvailableSlots(date: string, studioId?: string, coachId?: string): Promise<{ time: string; status: 'available' | 'full' }[]> {
        const params = new URLSearchParams({ date });
        if (studioId) params.append('studioId', studioId);
        if (coachId) params.append('coachId', coachId);

        return authenticatedFetch(`/client-portal/slots?${params.toString()}`);
    },

    async getCoaches(): Promise<any[]> {
        return authenticatedFetch('/client-portal/coaches');
    },

    async joinWaitingList(data: { studioId?: string; preferredDate: string; preferredTimeSlot: string; notes?: string }): Promise<any> {
        return authenticatedFetch('/client-portal/waiting-list', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async bookSession(data: any): Promise<any> {
        return authenticatedFetch('/client-portal/sessions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async validateRecurrence(data: any): Promise<{ validSessions: string[], conflicts: Array<{ date: string, conflict: string }> }> {
        return authenticatedFetch('/client-portal/sessions/validate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async cancelSession(id: string, reason?: string): Promise<any> {
        return authenticatedFetch(`/client-portal/sessions/${id}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({ reason })
        });
    },

    async createReview(data: { sessionId: string; rating: number; comments: string }): Promise<any> {
        return authenticatedFetch('/reviews', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getProfile(): Promise<any> {
        return authenticatedFetch('/client-portal/profile');
    },

    async updateProfile(data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        avatarUrl?: string;
        gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
        healthGoals?: Array<{ id: string; goal: string; completed: boolean; targetDate?: string }>;
        medicalHistory?: { allergies: string[]; injuries: string[]; conditions: string[]; custom?: any };
        healthNotes?: string;
        consentFlags?: { marketing: boolean; data_processing: boolean };
        privacyPreferences?: { leaderboard_visible: boolean; activity_feed_visible: boolean };
    }): Promise<any> {
        return authenticatedFetch('/client-portal/profile', {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    async getMyWaitingList(): Promise<any[]> {
        return authenticatedFetch('/client-portal/waiting-list');
    },

    async cancelWaitingListEntry(id: string): Promise<void> {
        return authenticatedFetch(`/client-portal/waiting-list/${id}`, {
            method: 'DELETE'
        });
    },

    async getAchievements(): Promise<any[]> {
        return authenticatedFetch('/gamification/achievements');
    },

    async getGoals(): Promise<any[]> {
        return authenticatedFetch('/gamification/goals');
    },

    async setGoal(data: { goalType: string; targetValue: number; deadline?: string; notes?: string }): Promise<any> {
        return authenticatedFetch('/gamification/goals', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getLeaderboard(): Promise<any[]> {
        return authenticatedFetch('/gamification/leaderboard');
    },

    async getActivityFeed(): Promise<any[]> {
        return authenticatedFetch('/gamification/feed');
    },

    async toggleFavoriteCoach(coachId: string): Promise<{ favorited: boolean }> {
        return authenticatedFetch(`/client-portal/favorite-coaches/${coachId}`, {
            method: 'POST'
        });
    },

    async getFavoriteCoaches(): Promise<any[]> {
        return authenticatedFetch('/client-portal/favorite-coaches');
    },

    async getProgressPhotos(): Promise<any[]> {
        return authenticatedFetch('/client-portal/progress-photos');
    },

    async addProgressPhoto(data: { photoUrl: string; notes?: string; type?: 'front' | 'back' | 'side' | 'other'; takenAt?: Date }): Promise<any> {
        return authenticatedFetch('/client-portal/progress-photos', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteProgressPhoto(id: string): Promise<any> {
        return authenticatedFetch(`/client-portal/progress-photos/${id}`, {
            method: 'DELETE'
        });
    },

    async uploadProgressPhoto(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

        const response = await fetch(`${API_URL}/storage/upload`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    }
};
