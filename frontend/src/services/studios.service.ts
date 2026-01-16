const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Studio {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    country: string | null;
    timezone: string;
    contactEmail: string | null;
    contactPhone: string | null;
    active: boolean;
    // Computed for UI compatibility
    isActive: boolean;
}

export interface CreateStudioInput {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    timezone?: string;
    contactEmail?: string;
    contactPhone?: string;
}

// Transform backend response to add isActive alias
function transformStudio(studio: any): Studio {
    return {
        ...studio,
        isActive: studio.active,
    };
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
        const studios = await response.json();
        return studios.map(transformStudio);
    },

    async getOne(id: string): Promise<Studio> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/studios/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch studio');
        return transformStudio(await response.json());
    },

    async create(data: CreateStudioInput): Promise<Studio> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/studios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create studio');
        return transformStudio(await response.json());
    },

    async update(id: string, data: Partial<CreateStudioInput & { active: boolean }>): Promise<Studio> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/studios/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update studio');
        return transformStudio(await response.json());
    },

    async delete(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/studios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete studio');
    }
};
