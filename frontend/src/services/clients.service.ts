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
        gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
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
    },

    async uploadProgressPhoto(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);

        return authenticatedFetch('/storage/upload', {
            method: 'POST',
            body: formData
        });
    },

    async getFavoriteCoach(id: string): Promise<{ id: string; name: string; firstName: string; lastName: string; avatarUrl: string | null; favoritedAt?: string; sessionCount?: number; isFavorite?: boolean } | null> {
        return authenticatedFetch(`/clients/${id}/favorite-coach`);
    },

    async getMostUsedRoom(id: string): Promise<{ roomId: string; roomName: string; usageCount: number } | null> {
        return authenticatedFetch(`/clients/${id}/most-used-room`);
    },

    // ==================== Document Management ====================

    async uploadDocument(clientId: string, file: File, category: string): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        return authenticatedFetch(`/clients/${clientId}/documents`, {
            method: 'POST',
            body: formData
        });
    },

    async getDocuments(clientId: string, category?: string): Promise<any[]> {
        const query = category ? `?category=${category}` : '';
        return authenticatedFetch(`/clients/${clientId}/documents${query}`);
    },

    async deleteDocument(clientId: string, documentId: string): Promise<void> {
        return authenticatedFetch(`/clients/${clientId}/documents/${documentId}`, {
            method: 'DELETE'
        });
    },

    async downloadDocument(clientId: string, documentId: string): Promise<Blob> {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${API_URL}/clients/${clientId}/documents/${documentId}/download`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to download document');
        }

        return response.blob();
    }
};
