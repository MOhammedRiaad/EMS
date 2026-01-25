import { api } from './api';

export interface TermsOfService {
    id: string;
    version: string;
    content: string;
    isActive: boolean;
    publishedAt: string;
    tenantId: string;
}

export const termsService = {
    async getActive(): Promise<TermsOfService | null> {
        const response = await api.get('/terms/active');
        return response.data;
    },

    async checkStatus(): Promise<{ accepted: boolean; termsId?: string }> {
        const response = await api.get('/terms/status');
        return response.data;
    },

    async accept(termsId: string): Promise<void> {
        await api.post('/terms/accept', { termsId });
    }
};
