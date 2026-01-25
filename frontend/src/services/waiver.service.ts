import { authenticatedFetch } from './api';

export interface Waiver {
    id: string;
    version: string;
    content: string;
}

export interface WaiverStatus {
    signed: boolean;
    signedAt?: string;
    waiverId?: string;
}

export const waiverService = {
    getLatestWaiver: async (): Promise<Waiver> => {
        return authenticatedFetch('/waivers/latest');
    },

    checkStatus: async (): Promise<WaiverStatus> => {
        return authenticatedFetch('/waivers/status');
    },

    signWaiver: async (waiverId: string, signatureData: string): Promise<void> => {
        await authenticatedFetch('/waivers/sign', {
            method: 'POST',
            body: JSON.stringify({ waiverId, signatureData })
        });
    }
};
