const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Session {
    id: string;
    studioId: string;
    roomId: string;
    coachId: string;
    clientId: string;
    startTime: string;
    endTime: string;
    status: string;
    programType?: string;
    notes?: string;
    client?: { firstName: string; lastName: string; avatarUrl?: string };
    coach?: {
        id: string;
        user?: { firstName: string | null; lastName: string | null };
    };
    room?: { name: string };
    studio?: { name: string };
}

export interface CreateSessionInput {
    studioId: string;
    roomId: string;
    coachId: string;
    clientId: string;
    startTime: string;
    endTime: string;
    programType?: string;
    notes?: string;
    emsDeviceId?: string;
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

    async create(data: CreateSessionInput): Promise<Session> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Throw error with conflict details if present
            const error: any = new Error(errorData.message || 'Failed to create session');
            if (errorData.conflicts) {
                error.conflicts = errorData.conflicts;
            }
            throw error;
        }
        return response.json();
    }
};
