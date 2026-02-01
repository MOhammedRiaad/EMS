import { authenticatedFetch } from './api';

export interface Client {
    id: string;
    userId?: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: string;
    avatarUrl?: string | null;
    creditBalance?: number;
    healthNotes?: string;
    notes?: string;
    studioId?: string | null;
    healthGoals?: Array<{
        id: string;
        goal: string;
        targetDate?: string;
        completed: boolean;
    }>;
    medicalHistory?: {
        allergies: string[];
        injuries: string[];
        conditions: string[];
        custom?: any;
    };
    // Nested relations from backend
    studio?: {
        id: string;
        name: string;
    } | null;
    user?: {
        id: string;
        gender?: 'male' | 'female' | 'other' | 'pnts';
    } | null;
}

export interface ClientProgressPhoto {
    id: string;
    clientId: string;
    photoUrl: string;
    takenAt: string;
    notes?: string;
    type?: 'front' | 'back' | 'side' | 'other';
}

export interface CreateProgressPhotoDto {
    photoUrl: string;
    notes?: string;
    type?: 'front' | 'back' | 'side' | 'other';
}

export const clientsService = {
    async getAll(search?: string): Promise<Client[]> {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return authenticatedFetch(`/clients${query}`);
    },

    async create(data: Partial<Client>): Promise<Client> {
        return authenticatedFetch('/clients', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async createWithUser(data: any): Promise<Client> {
        return authenticatedFetch('/clients/create-with-user', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async update(id: string, data: Partial<Client>): Promise<Client> {
        return authenticatedFetch(`/clients/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    async delete(id: string): Promise<void> {
        return authenticatedFetch(`/clients/${id}`, {
            method: 'DELETE'
        });
    },

    async invite(id: string): Promise<void> {
        return authenticatedFetch(`/clients/${id}/invite`, {
            method: 'POST'
        });
    },

    async getTransactions(id: string): Promise<any[]> {
        return authenticatedFetch(`/clients/${id}/transactions`);
    },

    async adjustBalance(id: string, amount: number, description: string): Promise<void> {
        return authenticatedFetch(`/clients/${id}/balance`, {
            method: 'POST',
            body: JSON.stringify({ amount, description })
        });
    },

    async getWaivers(id: string): Promise<any[]> {
        return authenticatedFetch(`/clients/${id}/waivers`);
    },

    async addPhoto(id: string, data: CreateProgressPhotoDto): Promise<ClientProgressPhoto> {
        return authenticatedFetch(`/clients/${id}/photos`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getPhotos(id: string): Promise<ClientProgressPhoto[]> {
        return authenticatedFetch(`/clients/${id}/photos`);
    },

    async deletePhoto(id: string, photoId: string): Promise<void> {
        return authenticatedFetch(`/clients/${id}/photos/${photoId}`, {
            method: 'DELETE'
        });
    }
};
