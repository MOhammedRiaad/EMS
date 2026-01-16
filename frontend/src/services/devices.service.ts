const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Device {
    id: string;
    studioId: string;
    label: string;
    serialNumber: string | null;
    model: string | null;
    status: 'available' | 'in_use' | 'maintenance';
    lastMaintenanceDate: string | null;
    nextMaintenanceDate: string | null;
    notes: string | null;
    studio?: { id: string; name: string };
}

export interface CreateDeviceInput {
    studioId: string;
    label: string;
    serialNumber?: string;
    model?: string;
    notes?: string;
}

export const devicesService = {
    async getAll(): Promise<Device[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch devices');
        return response.json();
    },

    async getByStudio(studioId: string): Promise<Device[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/devices?studioId=${studioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch devices');
        return response.json();
    },

    async getAvailableByStudio(studioId: string): Promise<Device[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/devices?studioId=${studioId}&available=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch devices');
        return response.json();
    },

    async create(data: CreateDeviceInput): Promise<Device> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/devices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create device');
        return response.json();
    },

    async update(id: string, data: Partial<Device>): Promise<Device> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/devices/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update device');
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/devices/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete device');
    }
};
