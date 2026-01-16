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
    intensityLevel?: number;
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

export interface SessionQuery {
    from?: string;
    to?: string;
    studioId?: string;
    coachId?: string;
    clientId?: string;
    status?: string;
}

export const sessionsService = {
    async getAll(query?: SessionQuery): Promise<Session[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (query) {
            if (query.from) params.append('from', query.from);
            if (query.to) params.append('to', query.to);
            if (query.studioId) params.append('studioId', query.studioId);
            if (query.coachId) params.append('coachId', query.coachId);
            if (query.clientId) params.append('clientId', query.clientId);
            if (query.status) params.append('status', query.status);
        }

        const response = await fetch(`${API_URL}/sessions?${params.toString()}`, {
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
    },

    async update(id: string, data: Partial<CreateSessionInput>): Promise<Session> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/sessions/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: any = new Error(errorData.message || 'Failed to update session');
            if (errorData.conflicts) {
                error.conflicts = errorData.conflicts;
            }
            throw error;
        }
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/sessions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete session');
    },

    async updateStatus(id: string, status: string, cancelledReason?: string): Promise<Session> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/sessions/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, cancelledReason })
        });

        if (!response.ok) throw new Error('Failed to update session status');
        return response.json();
    }
};
