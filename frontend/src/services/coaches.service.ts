const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Coach {
    id: string;
    userId: string;
    studioId: string;
    bio: string | null;
    specializations: string[];
    active: boolean;
    // Nested user data from backend
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
    };
    studio?: {
        id: string;
        name: string;
    };
}

// Flattened interface for UI display
export interface CoachDisplay {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    bio: string | null;
    specializations: string[];
    studioId: string;
    studioName: string;
    active: boolean;
    availabilityRules?: any[];
}

// Transform backend Coach to display format
export function transformCoachForDisplay(coach: Coach): CoachDisplay {
    return {
        id: coach.id,
        firstName: coach.user?.firstName || '',
        lastName: coach.user?.lastName || '',
        email: coach.user?.email || '',
        bio: coach.bio,
        specializations: coach.specializations || [],
        studioId: coach.studioId || '',
        studioName: coach.studio?.name || '',
        active: coach.active,
    };
}

export interface CreateCoachInput {
    userId: string;
    studioId: string;
    bio?: string;
    specializations?: string[];
}

export const coachesService = {
    async getAll(): Promise<CoachDisplay[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coaches`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch coaches');
        const coaches: Coach[] = await response.json();
        return coaches.map(transformCoachForDisplay);
    },

    async getByStudio(studioId: string): Promise<CoachDisplay[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coaches?studioId=${studioId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch coaches');
        const coaches: Coach[] = await response.json();
        return coaches.map(transformCoachForDisplay);
    },

    async create(data: CreateCoachInput): Promise<Coach> {
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
    },

    async update(id: string, data: Partial<CreateCoachInput>): Promise<Coach> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coaches/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update coach');
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/coaches/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete coach');
    }
};
