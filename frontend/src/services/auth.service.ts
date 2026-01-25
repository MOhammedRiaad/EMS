import { authenticatedFetch } from './api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterDto {
    businessName: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface SetupPasswordDto {
    token: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: 'tenant_owner' | 'admin' | 'coach' | 'client';
        tenantId: string;
    };
    tenant: {
        id: string;
        name: string;
        slug: string;
        isComplete: boolean;
    };
}

class AuthService {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        return authenticatedFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async register(data: RegisterDto): Promise<AuthResponse> {
        return authenticatedFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async setupPassword(data: SetupPasswordDto): Promise<AuthResponse> {
        return authenticatedFetch('/auth/setup', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

export const authService = new AuthService();
