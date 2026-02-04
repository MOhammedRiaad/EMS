import { authenticatedFetch } from './api';

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
    emsDeviceId?: string;
    client?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
    coach?: {
        id: string;
        user?: { firstName: string | null; lastName: string | null };
    };
    room?: { name: string };
    studio?: { name: string };
    type: 'individual' | 'group';
    capacity: number;
    participants?: SessionParticipant[];
    recurrencePattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable' | null;
    recurrenceEndDate?: string;
    parentSessionId?: string | null;
    isRecurringParent?: boolean;
}

export interface SessionParticipant {
    id: string;
    clientId: string;
    sessionId: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    joinedAt: string;
    client?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
    };
}

export interface CreateSessionInput {
    studioId: string;
    roomId: string;
    coachId: string;
    clientId?: string; // Optional for group
    startTime: string;
    endTime: string;
    programType?: string;
    notes?: string;
    emsDeviceId?: string;
    recurrencePattern?: 'weekly' | 'biweekly' | 'monthly';
    recurrenceEndDate?: string;
    recurrenceDays?: number[];
    type: 'individual' | 'group';
    capacity: number;
    allowTimeChangeOverride?: boolean;
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
        const params = new URLSearchParams();
        if (query) {
            if (query.from) params.append('from', query.from);
            if (query.to) params.append('to', query.to);
            if (query.studioId) params.append('studioId', query.studioId);
            if (query.coachId) params.append('coachId', query.coachId);
            if (query.clientId) params.append('clientId', query.clientId);
            if (query.status) params.append('status', query.status);
        }

        return authenticatedFetch(`/sessions?${params.toString()}`);
    },

    async getById(id: string): Promise<Session> {
        return authenticatedFetch(`/sessions/${id}`);
    },

    async create(data: CreateSessionInput): Promise<Session> {
        return authenticatedFetch('/sessions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async update(id: string, data: Partial<CreateSessionInput>): Promise<Session> {
        return authenticatedFetch(`/sessions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    async updateSeries(id: string, data: Partial<CreateSessionInput>): Promise<void> {
        return authenticatedFetch(`/sessions/${id}/series`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    async delete(id: string): Promise<void> {
        return authenticatedFetch(`/sessions/${id}`, {
            method: 'DELETE'
        });
    },

    async deleteSeries(id: string): Promise<void> {
        return authenticatedFetch(`/sessions/${id}/series`, {
            method: 'DELETE'
        });
    },

    async updateStatus(id: string, status: string, cancelledReason?: string, deductSession?: boolean): Promise<Session> {
        return authenticatedFetch(`/sessions/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, cancelledReason, deductSession })
        });
    },

    async addParticipant(sessionId: string, clientId: string): Promise<SessionParticipant> {
        return authenticatedFetch(`/sessions/${sessionId}/participants/${clientId}`, {
            method: 'POST'
        });
    },

    async removeParticipant(sessionId: string, clientId: string): Promise<void> {
        return authenticatedFetch(`/sessions/${sessionId}/participants/${clientId}/remove`, {
            method: 'POST'
        });
    },

    async updateParticipantStatus(sessionId: string, clientId: string, status: string): Promise<SessionParticipant> {
        return authenticatedFetch(`/sessions/${sessionId}/participants/${clientId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
};
