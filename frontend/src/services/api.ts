const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    async get(endpoint: string, params?: Record<string, any>) {
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

        return response.json();
    },

    post: async (endpoint: string, body: any) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Throw object resembling axios error response
            throw { response: { data } };
        }

        // Return object resembling axios success response
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
