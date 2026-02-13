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
    planKey?: string;
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

export interface Plan {
    key: string;
    name: string;
    price: number | null;
    description: string | null;
    features: string[];
    limits: any;
}


class AuthService {
    async getPlans(): Promise<Plan[]> {
        return authenticatedFetch('/auth/plans', {
            method: 'GET'
        });
    }

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

    async generateTwoFactor(): Promise<{ secret: string; qrCode: string }> {
        return authenticatedFetch('/auth/2fa/generate', {
            method: 'POST'
        });
    }

    async enableTwoFactor(token: string): Promise<any> {
        return authenticatedFetch('/auth/2fa/enable', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    async disableTwoFactor(): Promise<any> {
        return authenticatedFetch('/auth/2fa/disable', {
            method: 'POST'
        });
    }

    async verifyTwoFactor(userId: string, token: string): Promise<AuthResponse> {
        return authenticatedFetch('/auth/2fa/authenticate', {
            method: 'POST',
            body: JSON.stringify({ userId, token })
        });
    }
}

export const authService = new AuthService();
