import { authenticatedFetch } from './api';

export interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    phone?: string | null;
    gender?: 'male' | 'female' | 'other' | 'pnts';
    active?: boolean;
    tenantId?: string;
}

export interface CreateUserDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'coach' | 'client';
    gender?: 'male' | 'female' | 'other' | 'pnts';
    phone?: string;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: 'admin' | 'coach' | 'client';
    gender?: 'male' | 'female' | 'other' | 'pnts';
    phone?: string;
    active?: boolean;
}

class UsersService {
    /**
     * Get all users in the current tenant
     */
    async getAllUsers(role?: string): Promise<User[]> {
        const endpoint = role ? `/auth/users?role=${role}` : '/auth/users';
        return authenticatedFetch(endpoint);
    }

    /**
     * Create a new user in the current tenant
     */
    async createUser(data: CreateUserDto): Promise<User> {
        return authenticatedFetch('/auth/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update an existing user
     */
    async updateUser(id: string, data: UpdateUserDto): Promise<User> {
        return authenticatedFetch(`/auth/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a user
     */
    async deleteUser(id: string): Promise<void> {
        return authenticatedFetch(`/auth/users/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Toggle user active status
     */
    async toggleActive(id: string, active: boolean): Promise<User> {
        return authenticatedFetch(`/auth/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ active }),
        });
    }

    /**
     * Get a specific user by ID
     */
    async getUserById(id: string): Promise<User> {
        return authenticatedFetch(`/auth/users/${id}`);
    }
}

export const usersService = new UsersService();
