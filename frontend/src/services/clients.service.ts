const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch clients');
        return response.json();
    },

    async create(data: Partial<Client>): Promise<Client> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create client');
        return response.json();
    },

    async createWithUser(data: any): Promise<Client> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients/create-with-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create client');
        }
        return response.json();
    },

    async update(id: string, data: Partial<Client>): Promise<Client> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update client');
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete client');
    },

    async invite(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients/${id}/invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to send invitation');
        }
    },

    async getTransactions(id: string): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients/${id}/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    async adjustBalance(id: string, amount: number, description: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients/${id}/balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount, description })
        });
        if (!response.ok) throw new Error('Failed to adjust balance');
    },

    async getWaivers(id: string): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/clients/${id}/waivers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch waivers');
        return response.json();
    }
};
