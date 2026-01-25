const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<{ data: T }> {
        const url = new URL(`${API_URL}${endpoint}`);
        if (params) {
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        }

        const response = await fetch(url.toString(), {
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw { response: { data } };
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
            throw { response: { data } };
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
            throw { response: { data } };
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
            throw { response: { data } };
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
        throw new Error(data.message || 'API request failed');
    }
    return response.json();
};
