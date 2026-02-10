const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface CoachDashboardStats {
    sessionsCount: number;
    nextSession: any;
}

export interface CoachSession {
    id: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
    type?: 'individual' | 'group';
    room?: { name: string };
    studio?: { name: string };
    client: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage?: string;
    } | null;
    lead?: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
    participants?: Array<{
        id: string;
        status: string;
        client: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }>;
    notes?: string;
}

// Helper to extract error message from API response
async function handleApiError(response: Response, fallbackMessage: string): Promise<never> {
    try {
        const errorData = await response.json();
        // Handle nested error structure: { message: { message: "actual error" } }
        const message = errorData?.message?.message || errorData?.message || fallbackMessage;
        throw new Error(message);
    } catch (e) {
        if (e instanceof Error && e.message !== fallbackMessage) {
            throw e;
        }
        throw new Error(fallbackMessage);
    }
}

export const coachPortalService = {
    async getDashboard(): Promise<CoachDashboardStats> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coach-portal/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) await handleApiError(response, 'Failed to fetch dashboard');
        return response.json();
    },

    async getSchedule(range: 'day' | 'week' | 'month' | 'future' = 'day', date?: string): Promise<CoachSession[]> {
        const token = localStorage.getItem('token');
        const url = new URL(`${API_URL}/coach-portal/schedule`);
        url.searchParams.append('range', range);
        if (date) url.searchParams.append('date', date);

        const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) await handleApiError(response, 'Failed to fetch schedule');
        return response.json();
    },

    async updateSessionStatus(sessionId: string, status: 'completed' | 'no_show' | 'cancelled'): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coach-portal/sessions/${sessionId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        if (!response.ok) await handleApiError(response, 'Failed to update session status');
    },

    async getMyClients(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coach-portal/clients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) await handleApiError(response, 'Failed to fetch clients');
        return response.json();
    },

    async getClientDetails(clientId: string): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coach-portal/clients/${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) await handleApiError(response, 'Failed to fetch client details');
        return response.json();
    },

    async getAvailability(): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coach-portal/availability`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) await handleApiError(response, 'Failed to fetch availability');
        return response.json();
    },

    async updateAvailability(rules: any[]): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coach-portal/availability`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(rules)
        });
        if (!response.ok) await handleApiError(response, 'Failed to update availability');
        return response.json();
    }
};
