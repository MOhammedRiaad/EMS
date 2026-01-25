import { api } from './api';

export interface ParqResponse {
    id: string;
    clientId: string;
    responses: Record<string, boolean>;
    hasRisk: boolean;
    signatureData: string;
    signedAt: string;
    tenantId: string;
}

export interface CreateParqDto {
    clientId: string;
    responses: Record<string, boolean>;
    signatureData: string;
}

export const parqService = {
    async create(dto: CreateParqDto): Promise<ParqResponse> {
        const response = await api.post('/parq', dto);
        return response.data;
    },

    async getLatest(clientId: string): Promise<ParqResponse | null> {
        const response = await api.get(`/parq/latest/${clientId}`);
        return response.data;
    },
};
