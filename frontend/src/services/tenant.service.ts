const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface TenantSettings {
    cancellationWindowHours?: number;
    [key: string]: any;
}

export interface Tenant {
    id: string;
    name: string;
    slug?: string;
    address?: string;
    phone?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    settings: TenantSettings;
}

export interface UpdateTenantInput {
    name?: string;
    address?: string;
    phone?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    settings?: TenantSettings;
}

export const tenantService = {
    async get(id: string): Promise<Tenant> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tenants/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch tenant profile');
        return response.json();
    },

    async update(id: string, data: UpdateTenantInput): Promise<Tenant> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tenants/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update tenant profile');
        return response.json();
    }
};
