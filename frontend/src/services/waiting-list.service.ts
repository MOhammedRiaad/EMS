const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export interface WaitingListEntry {
    id: string;
    tenantId: string;
    clientId: string;
    studioId: string;
    sessionId?: string;
    coachId?: string;
    preferredDate?: string;
    preferredTimeSlot?: string;
    status: 'pending' | 'approved' | 'notified' | 'booked' | 'cancelled';
    requiresApproval: boolean;
    priority: number;
    approvedBy?: string;
    approvedAt?: string;
    notifiedAt?: string;
    notificationMethod?: string;
    notes?: string;
    createdAt: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    studio: {
        id: string;
        name: string;
    };
    coach?: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
        }
    };
    session?: {
        id: string;
        startTime: string;
        endTime: string;
    };
}

export interface CreateWaitingListEntryDto {
    clientId: string;
    studioId: string;
    sessionId?: string;
    coachId?: string;
    preferredDate?: string;
    preferredTimeSlot?: string;
    requiresApproval?: boolean;
    notes?: string;
    notificationMethod?: string;
}

export interface UpdateWaitingListEntryDto {
    status?: 'pending' | 'approved' | 'notified' | 'booked' | 'cancelled';
    priority?: number;
    requiresApproval?: boolean;
}

export const waitingListService = {
    getAll: async (filter?: any): Promise<WaitingListEntry[]> => {
        const queryParams = new URLSearchParams(filter).toString();
        const response = await fetch(`${API_URL}/waiting-list?${queryParams}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch waiting list');
        return response.json();
    },

    getMyEntries: async (): Promise<WaitingListEntry[]> => {
        const response = await fetch(`${API_URL}/waiting-list/my-entries`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch my entries');
        return response.json();
    },

    getByClient: async (clientId: string): Promise<WaitingListEntry[]> => {
        const response = await fetch(`${API_URL}/waiting-list/client/${clientId}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch client entries');
        return response.json();
    },

    create: async (data: CreateWaitingListEntryDto): Promise<WaitingListEntry> => {
        const response = await fetch(`${API_URL}/waiting-list`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create entry');
        return response.json();
    },

    update: async (id: string, data: UpdateWaitingListEntryDto): Promise<WaitingListEntry> => {
        const response = await fetch(`${API_URL}/waiting-list/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update entry');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/waiting-list/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete entry');
    },

    approve: async (id: string): Promise<WaitingListEntry> => {
        const response = await fetch(`${API_URL}/waiting-list/${id}/approve`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to approve entry');
        return response.json();
    },

    reject: async (id: string): Promise<WaitingListEntry> => {
        const response = await fetch(`${API_URL}/waiting-list/${id}/reject`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to reject entry');
        return response.json();
    },

    updatePriority: async (id: string, priority: number): Promise<WaitingListEntry> => {
        const response = await fetch(`${API_URL}/waiting-list/${id}/priority`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ priority })
        });
        if (!response.ok) throw new Error('Failed to update priority');
        return response.json();
    },

    notify: async (id: string): Promise<WaitingListEntry> => {
        const response = await fetch(`${API_URL}/waiting-list/${id}/notify`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to notify client');
        return response.json();
    },

    markAsBooked: async (id: string): Promise<WaitingListEntry> => {
        const response = await fetch(`${API_URL}/waiting-list/${id}/book`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to mark as booked');
        return response.json();
    }
};
