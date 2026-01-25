import { authenticatedFetch } from './api';

export interface Coach {
    id: string;
    userId: string;
    studioId: string;
    bio: string | null;
    specializations: string[];
    active: boolean;
    preferredClientGender: 'male' | 'female' | 'any';
    // Nested user data from backend
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        avatarUrl?: string | null;
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
    preferredClientGender: 'male' | 'female' | 'any';
    studioId: string;
    studioName: string;
    active: boolean;
    avatarUrl?: string | null;
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
        preferredClientGender: coach.preferredClientGender || 'any',
        studioId: coach.studioId || '',
        studioName: coach.studio?.name || '',
        active: coach.active,
        avatarUrl: coach.user?.avatarUrl || null,
        availabilityRules: (coach as any).availabilityRules
    };
}

export interface CreateCoachInput {
    userId: string;
    studioId: string;
    bio?: string;
    specializations?: string[];
    preferredClientGender?: 'male' | 'female' | 'any';
    availabilityRules?: any[];
    active?: boolean;
}

export const coachesService = {
    async getAll(): Promise<CoachDisplay[]> {
        const coaches: Coach[] = await authenticatedFetch('/coaches');
        return coaches.map(transformCoachForDisplay);
    },

    async getByStudio(studioId: string): Promise<CoachDisplay[]> {
        const coaches: Coach[] = await authenticatedFetch(`/coaches?studioId=${studioId}`);
        return coaches.map(transformCoachForDisplay);
    },

    async create(data: CreateCoachInput): Promise<Coach> {
        return authenticatedFetch('/coaches', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async createWithUser(data: any): Promise<Coach> {
        return authenticatedFetch('/coaches/create-with-user', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async update(id: string, data: Partial<CreateCoachInput>): Promise<Coach> {
        return authenticatedFetch(`/coaches/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    async delete(id: string): Promise<void> {
        return authenticatedFetch(`/coaches/${id}`, {
            method: 'DELETE'
        });
    }
};
