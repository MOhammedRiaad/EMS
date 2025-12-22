const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const storageService = {
    async upload(file: File): Promise<string> {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/storage/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type is set automatically by fetch for FormData
            },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload file');
        const data = await response.json();
        return data.url; // Relative URL returned by backend
    },

    getPublicUrl(path: string): string {
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`; // Proxy url logic if needed, or if backend returns /api/storage/file?key=...
        // Backend returns `/api/storage/file?key=...` which is relative path from domain root?
        // If backend returns `/api/storage/file?key=...`, and API_URL is `http://localhost:3000/api`,
        // then we might need to adjust.
        // Actually, backend returns `/api/storage/file?key=...`. 
        // If we use it as `src`, it will be relative to FRONTEND domain `localhost:5173/api/...`.
        // We need it to be absolute `http://localhost:3000/api/...`.
        // Or we proxy /api in vite.
        // If Vite proxies /api -> http://localhost:3000/api, then relative works.
        // Assuming Vite proxy is set up or we construct full URL.
    }
};
