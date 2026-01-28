import { api } from './api';

export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: 'new' | 'contacted' | 'trial_booked' | 'converted' | 'lost';
    source?: string;
    notes?: string;
    assignedTo?: { id: string; firstName: string; lastName: string };
    createdAt: string;
    updatedAt: string;
}

export interface CreateLeadDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    source?: string;
    notes?: string;
    assigned_to_id?: string;
}

export const leadService = {
    async getAll(filters?: { status?: string; source?: string; search?: string }) {
        const res = await api.get<Lead[]>('/leads', filters);
        return res.data;
    },

    // Actually, let's verify api.ts return type pattern.
    // In api.ts: `async get<T = any>(...): Promise<{ data: T }>`
    // The implementation: `const data = await response.json(); return { data };`
    // So if backend `findAll` returns array, `T` is `Lead[]`. and result is `{ data: Lead[] }`.
    // So `res.data` gives the array.

    async getOne(id: string) {
        const res = await api.get<Lead>(`/leads/${id}`);
        return res.data;
    },

    async create(data: CreateLeadDto) {
        const res = await api.post<Lead>('/leads', data);
        return res.data;
    },

    async update(id: string, data: Partial<CreateLeadDto> & { status?: string }) {
        const res = await api.patch<Lead>(`/leads/${id}`, data);
        return res.data;
    },

    async delete(id: string) {
        await api.delete(`/leads/${id}`);
    },

    async convertToClient(id: string) {
        const res = await api.post(`/leads/${id}/convert`, {});
        return res.data;
    },

    async addActivity(id: string, type: string, content: string) {
        const res = await api.post(`/leads/${id}/activities`, { type, content });
        return res.data;
    }
};
