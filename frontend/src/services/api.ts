/* eslint-disable @typescript-eslint/no-explicit-any */
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
    data?: any;

    constructor(message: string, statusCode?: number, error?: string, conflicts?: any[], data?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.error = error;
        this.conflicts = conflicts;
        this.data = data;
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

export const apiEvents = new EventTarget();

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
            if (response.status === 402) {
                apiEvents.dispatchEvent(new CustomEvent('limit-reached', { detail: data }));
            }
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts, data);
        }

        if (response.status === 204) {
            return { data: null as any };
        }

        const text = await response.text();
        const data = text && text.trim() ? JSON.parse(text) : null;
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
            if (response.status === 402) {
                apiEvents.dispatchEvent(new CustomEvent('limit-reached', { detail: data }));
            }
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts, data);
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
            if (response.status === 402) {
                apiEvents.dispatchEvent(new CustomEvent('limit-reached', { detail: data }));
            }
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts, data);
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
            if (response.status === 402) {
                apiEvents.dispatchEvent(new CustomEvent('limit-reached', { detail: data }));
            }
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts, data);
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
            if (response.status === 402) {
                apiEvents.dispatchEvent(new CustomEvent('limit-reached', { detail: data }));
            }
            const message = formatErrorMessage(data);
            throw new ApiError(message, response.status, data.error, data.conflicts, data);
        }

        return { data };
    }
};

export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>)
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        cache: 'no-store'
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = formatErrorMessage(data);
        throw new ApiError(message, response.status, data.error, data.conflicts, data);
    }

    if (response.status === 204) {
        return {};
    }

    const text = await response.text();
    return text && text.trim() ? JSON.parse(text) : {};
};

