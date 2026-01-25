import { authenticatedFetch } from './api';

export interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: string;
    avatarUrl?: string | null;
    creditBalance?: number;
}

export const clientsService = {
    async getAll(): Promise<Client[]> {
        return authenticatedFetch('/clients');
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
    }
};
