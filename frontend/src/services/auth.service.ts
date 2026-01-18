const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterDto {
    name: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerFirstName?: string;
    ownerLastName?: string;
}

export interface SetupPasswordDto {
    token: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    token: string;
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
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    }

    async register(data: RegisterDto): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return response.json();
    }

    async setupPassword(data: SetupPasswordDto): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Password setup failed');
        }

        return response.json();
    }
}

export const authService = new AuthService();
