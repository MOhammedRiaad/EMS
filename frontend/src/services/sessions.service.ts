const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Session {
    id: string;
    startTime: string; // ISO Date
    endTime: string;
    status: string;
    programType?: string;
    notes?: string;
    clientId: string;
    coachId: string;
    client?: { firstName: string; lastName: string; avatarUrl?: string };
    coach?: { firstName: string; lastName: string; avatarUrl?: string };
    room?: { name: string };
    studio?: { name: string };
}

export const sessionsService = {
    async getAll(): Promise<Session[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/sessions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    },

    async create(data: Partial<Session>): Promise<Session> {
        const token = localStorage.getItem('token');
        // Ensure dates are ISO strings if they are Date objects

        const response = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create session');
        return response.json();
    }
};
