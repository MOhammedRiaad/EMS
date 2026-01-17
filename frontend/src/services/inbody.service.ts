const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface InBodyScan {
    id: string;
    clientId: string;
    scanDate: string;
    weight: number;
    bodyFatMass: number;
    skeletalMuscleMass: number;
    bodyFatPercentage: number;
    rightArmMuscle?: number | null;
    leftArmMuscle?: number | null;
    trunkMuscle?: number | null;
    rightLegMuscle?: number | null;
    leftLegMuscle?: number | null;
    bmr?: number | null;
    visceralFatLevel?: number | null;
    bodyWater?: number | null;
    protein?: number | null;
    mineral?: number | null;
    notes?: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    client?: {
        firstName: string;
        lastName: string;
    };
    fileUrl?: string;
    fileName?: string;
}

export interface CreateInBodyScanInput {
    clientId: string;
    scanDate: string;
    weight: number;
    bodyFatMass: number;
    skeletalMuscleMass: number;
    bodyFatPercentage: number;
    rightArmMuscle?: number;
    leftArmMuscle?: number;
    trunkMuscle?: number;
    rightLegMuscle?: number;
    leftLegMuscle?: number;
    bmr?: number;
    visceralFatLevel?: number;
    bodyWater?: number;
    protein?: number;
    mineral?: number;
    notes?: string;
    file?: File;
}

export interface ProgressData {
    first: {
        date: string;
        weight: number;
        bodyFatPercentage: number;
        skeletalMuscleMass: number;
    };
    latest: {
        date: string;
        weight: number;
        bodyFatPercentage: number;
        skeletalMuscleMass: number;
    };
    changes: {
        weight: number;
        bodyFatPercentage: number;
        skeletalMuscleMass: number;
        weightPercent: number;
        bodyFatPercent: number;
        muscleMassPercent: number;
    };
    totalScans: number;
}

class InBodyService {
    private getAuthHeaders(contentType?: string): HeadersInit {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            ...(token && { Authorization: `Bearer ${token}` }),
        };
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        return headers;
    }

    async create(data: CreateInBodyScanInput): Promise<InBodyScan> {
        let body: string | FormData;
        let headers: HeadersInit;

        if (data.file) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (value instanceof File) {
                        formData.append(key, value);
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            body = formData;
            headers = this.getAuthHeaders(); // No Content-Type for FormData
        } else {
            body = JSON.stringify(data);
            headers = this.getAuthHeaders('application/json');
        }

        const response = await fetch(`${API_URL}/inbody-scans`, {
            method: 'POST',
            headers,
            body,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create scan');
        }

        return response.json();
    }

    async getAll(clientId?: string, startDate?: string, endDate?: string): Promise<InBodyScan[]> {
        const params = new URLSearchParams();
        if (clientId) params.append('clientId', clientId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${API_URL}/inbody-scans?${params}`, {
            headers: this.getAuthHeaders('application/json'),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch scans');
        }

        return response.json();
    }

    async getByClient(clientId: string): Promise<InBodyScan[]> {
        const response = await fetch(`${API_URL}/inbody-scans/client/${clientId}`, {
            headers: this.getAuthHeaders('application/json'),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client scans');
        }

        return response.json();
    }

    async getLatest(clientId: string): Promise<InBodyScan | null> {
        const response = await fetch(`${API_URL}/inbody-scans/client/${clientId}/latest`, {
            headers: this.getAuthHeaders('application/json'),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch latest scan');
        }

        return response.json();
    }

    async getProgress(clientId: string): Promise<ProgressData> {
        const response = await fetch(`${API_URL}/inbody-scans/client/${clientId}/progress`, {
            headers: this.getAuthHeaders('application/json'),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch progress data');
        }

        return response.json();
    }

    async update(id: string, data: Partial<CreateInBodyScanInput>): Promise<InBodyScan> {
        let body: string | FormData;
        let headers: HeadersInit;

        if (data.file) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (value instanceof File) {
                        formData.append(key, value);
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            body = formData;
            headers = this.getAuthHeaders();
        } else {
            body = JSON.stringify(data);
            headers = this.getAuthHeaders('application/json');
        }

        const response = await fetch(`${API_URL}/inbody-scans/${id}`, {
            method: 'PATCH',
            headers,
            body,
        });

        if (!response.ok) {
            throw new Error('Failed to update scan');
        }

        return response.json();
    }

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/inbody-scans/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to delete scan');
        }
    }
}

export const inbodyService = new InBodyService();
