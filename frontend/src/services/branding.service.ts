import { api } from './api';

export interface BrandingSettings {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
}

export interface TenantSettings {
    branding?: BrandingSettings;
    [key: string]: any;
}

class BrandingService {
    async getSettings(tenantId: string): Promise<TenantSettings> {
        const response = await api.get<any>(`/tenants/${tenantId}`);
        // Extract settings.branding
        return response.data.settings || {};
    }

    async updateBranding(tenantId: string, branding: BrandingSettings): Promise<TenantSettings> {
        const response = await api.patch<any>(`/tenants/${tenantId}`, {
            branding
        });
        return response.data.settings || {};
    }
}

export const brandingService = new BrandingService();
