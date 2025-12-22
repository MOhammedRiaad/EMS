const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Studio {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
    status: string;
    isActive: boolean;
}

export const studiosService = {
    async getAll(): Promise<Studio[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/studios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch studios');
        return response.json();
    },

    async create(data: Partial<Studio>): Promise<Studio> {
        const token = localStorage.getItem('token');
        data.isActive = true;
        const response = await fetch(`${API_URL}/studios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create studio');
        return response.json();
    }
};
