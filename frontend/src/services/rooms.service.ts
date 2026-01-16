const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Room {
    id: string;
    name: string;
    capacity: number;
    studioId: string;
    studio?: { name: string };
}

export const roomsService = {
    async getAll(): Promise<Room[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rooms`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch rooms');
        return response.json();
    },

    async create(data: Partial<Room>): Promise<Room> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create room');
        return response.json();
    },

    async getByStudio(studioId: string): Promise<Room[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rooms?studioId=${studioId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch rooms');
        return response.json();
    }
};
