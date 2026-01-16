const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface DashboardStats {
    activeClients: number;
    activeCoaches: number;
    todaySessions: number;
    revenue: number;
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return response.json();
    }
};
