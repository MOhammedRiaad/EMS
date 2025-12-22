const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Coach {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    bio: string | null;
    specialties: string[];
    avatarUrl?: string | null;
    status: string;
}

export const coachesService = {
    async getAll(): Promise<Coach[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coaches`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch coaches');
        return response.json();
    },

    async create(data: Partial<Coach>): Promise<Coach> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coaches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create coach');
        return response.json();
    }
};
