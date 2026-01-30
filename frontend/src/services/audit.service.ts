import { authenticatedFetch } from './api';

export interface AuditLog {
    id: string;
    tenantId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    performedBy: string;
    details: any;
    createdAt: string;
    ipAddress: string | null;
}

export const auditService = {
    async getAll(limit: number = 100): Promise<AuditLog[]> {
        return authenticatedFetch(`/audit?limit=${limit}`);
    }
};
