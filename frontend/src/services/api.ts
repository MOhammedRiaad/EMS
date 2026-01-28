const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export class ApiError extends Error {
    statusCode?: number;
    error?: string;
    conflicts?: any[];

    constructor(message: string, statusCode?: number, error?: string, conflicts?: any[]) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.error = error;
        this.conflicts = conflicts;
    }
}

const formatErrorMessage = (errorData: any): string => {
    if (typeof errorData.message === 'string') {
        return errorData.message;
    }

    if (Array.isArray(errorData.message)) {
        return errorData.message.join('. ');
    }

    if (errorData.message && typeof errorData.message === 'object') {
        if (errorData.message.message) {
            if (typeof errorData.message.message === 'string') {
                return errorData.message.message;
            }
            if (Array.isArray(errorData.message.message)) {
                return errorData.message.message.join('. ');
            }
        }
        return JSON.stringify(errorData.message);
    }

    return errorData.error || 'API request failed';
};

export const api = {
    async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<{ data: T }> {
        const url = new URL(`${API_URL}${endpoint}`);
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                    url.searchParams.append(key, params[key]);
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts);
        }

        const data = await response.json();
        return { data };
    },

    async post<T = any>(endpoint: string, body: any): Promise<{ data: T }> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts);
        }

        return { data };
    },

    async put<T = any>(endpoint: string, body: any): Promise<{ data: T }> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts);
        }

        return { data };
    },

    async patch<T = any>(endpoint: string, body: any): Promise<{ data: T }> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts);
        }

        return { data };
    },

    async delete<T = any>(endpoint: string): Promise<{ data: T }> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts);
        }

        return { data };
    }
};

export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = formatErrorMessage(data);
        throw new ApiError(message, response.status, data.error, data.conflicts);
    }
    return response.json();
};
