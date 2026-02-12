import { api } from './api';

// --- Analytics Types ---
export interface GlobalAnalytics {
    revenue: {
        totalRevenue: number;
        revenueByPeriod: Array<{ date: string; amount: number }>;
        projectedMonthly: number;
    };
    usage: {
        totalSessions: number;
        avgSessionsPerTenant: number;
        sessionsByDay: Array<{ date: string; count: number }>;
        peakHour: number;
    };
    growth: {
        newTenantsThisMonth: number;
        newClientsThisMonth: number;
        tenantGrowthRate: number;
        churnRate: number;
    };
    engagement: {
        activeTenants7d: number;
        avgLoginsPerTenant: number;
    };
}

// --- Alert Types ---
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 'usage' | 'system' | 'billing' | 'security';

export interface Alert {
    id: string;
    type: string;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    message: string;
    tenantId?: string;
    tenantName?: string;
    data?: Record<string, any>;
    createdAt: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
}

// --- Upgrade Request Types ---
export interface UpgradeRequest {
    id: string;
    tenantId: string;
    tenantName: string;
    currentPlan: string;
    requestedPlan: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    reason: string;
    requestedAt: string;
    requesterName?: string;
    notes?: string;
}

// --- Plan Types ---
export interface PlanLimits {
    maxClients: number;
    maxCoaches: number;
    maxSessionsPerMonth: number;
    storageGB: number;
    smsAllowance: number;
    emailAllowance: number;
    locations: number;
    custom_branding: boolean;
    white_label_email: boolean;
    api_access: boolean;
    [key: string]: number | boolean;
}

export interface Plan {
    id: string;
    key: string;
    name: string;
    description?: string;
    price: number;
    limits: PlanLimits;
    features: string[]; // List of feature keys enabled for this plan
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- Feature Flag Types ---
export interface FeatureFlag {
    key: string;
    name: string;
    description?: string;
    category: string;
    isEnabled: boolean;
    isExperimental: boolean;
    dependencies?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TenantFeatureState {
    key: string;
    name: string;
    description?: string;
    category: string;
    isEnabled: boolean; // Computed status
    isOverridden: boolean;
    overrideValue?: boolean; // True/False if overridden
    dependencies?: string[];
}

// --- Role & Permission Types ---
export interface Permission {
    id: string;
    key: string;
    name: string;
    description: string;
    category: string;
}

export interface Role {
    id: string;
    key: string;
    name: string;
    description: string;
    isSystemRole: boolean;
    permissions: Permission[];
    tenantId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OwnerAuditLog {
    id: string;
    action: string;
    ownerId: string;
    targetTenantId?: string;
    details: any;
    ipAddress?: string;
    createdAt: string;
}

// --- Tenant Types ---
export interface TenantSummary {
    id: string;
    name: string;
    status: 'active' | 'trial' | 'suspended' | 'blocked';
    plan: {
        key: string;
        name: string;
    };
    contactEmail: string;
    createdAt: string;
    stats: {
        clients: number;
        sessionsThisMonth: number;
    };
}

export interface TenantListResponse {
    items: TenantSummary[];
    total: number;
    page: number;
    limit: number;
}

export const ownerPortalService = {
    // --- Tenants Management ---
    getTenants: async (params?: { search?: string; status?: string; plan?: string; page?: number; limit?: number }) => {
        const queryParams = {
            ...params,
            offset: params?.page && params?.limit ? (params.page - 1) * params.limit : 0
        };
        const response = await api.get<TenantListResponse>('/owner/tenants', queryParams);
        return response.data;
    },

    getAllTenants: async (params?: { limit?: number }) => {
        const response = await api.get<TenantListResponse>('/owner/tenants', params);
        return response.data;
    },

    getTenantDetails: async (tenantId: string) => {
        const response = await api.get(`/owner/tenants/${tenantId}`);
        return response.data;
    },

    suspendTenant: async (tenantId: string, reason: string) => {
        const response = await api.post(`/owner/tenants/${tenantId}/suspend`, { reason });
        return response.data;
    },

    reactivateTenant: async (tenantId: string) => {
        const response = await api.post(`/owner/tenants/${tenantId}/reactivate`, {});
        return response.data;
    },

    updateTenantPlan: async (tenantId: string, planKey: string) => {
        const response = await api.patch(`/owner/tenants/${tenantId}/plan`, { planKey });
        return response.data;
    },

    impersonateTenant: async (tenantId: string) => {
        const response = await api.post(`/owner/tenants/${tenantId}/impersonate`, {});
        return response.data;
    },

    resetDemoData: async (tenantId: string) => {
        const response = await api.post(`/owner/tenants/${tenantId}/reset-demo`, {});
        return response.data;
    },

    exportTenantData: async (tenantId: string) => {
        const response = await api.get(`/owner/tenants/${tenantId}/export`);
        return response.data;
    },

    deleteTenant: async (tenantId: string) => {
        const response = await api.delete(`/owner/tenants/${tenantId}`);
        return response.data;
    },

    anonymizeTenant: async (tenantId: string) => {
        const response = await api.post(`/owner/tenants/${tenantId}/anonymize`, {});
        return response.data;
    },

    // --- Automations ---
    getAutomationStats: async () => {
        const response = await api.get('/owner/automations/stats');
        return response.data;
    },

    getMessagingStats: async () => {
        const response = await api.get('/owner/messaging/stats');
        return response.data;
    },

    // --- Broadcasts ---
    createBroadcast: async (data: { subject: string; body: string; targetAudience: string; type: string }) => {
        const response = await api.post('/owner/broadcasts/draft', data);
        return response.data;
    },

    sendBroadcast: async (id: string) => {
        const response = await api.post(`/owner/broadcasts/${id}/send`, {});
        return response.data;
    },

    getBroadcastHistory: async () => {
        const response = await api.get('/owner/broadcasts/history');
        return response.data;
    },

    // --- System Settings ---
    getSystemSettings: async () => {
        const response = await api.get('/owner/settings');
        return response.data;
    },

    updateSystemSetting: async (key: string, value: any, category: string) => {
        const response = await api.patch('/owner/settings', { key, value, category });
        return response.data;
    },

    // --- Analytics ---
    getAnalytics: async (period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<GlobalAnalytics> => {
        const response = await api.get('/owner/analytics', { startDate: getDateForPeriod(period) });
        return response.data;
    },

    // --- Alerts ---
    getAlerts: async (filters?: { severity?: string; category?: string; acknowledged?: boolean; limit?: number }) => {
        const response = await api.get('/owner/alerts', filters);
        return response.data;
    },

    getAlertCounts: async () => {
        const response = await api.get('/owner/alerts/counts');
        return response.data;
    },

    acknowledgeAlert: async (id: string) => {
        const response = await api.post(`/owner/alerts/${id}/acknowledge`, {});
        return response.data;
    },

    acknowledgeAllAlerts: async (filters: { severity?: string } = {}) => {
        const response = await api.post('/owner/alerts/acknowledge-all', filters);
        return response.data;
    },

    triggerSystemCheck: async () => {
        const response = await api.post('/owner/alerts/trigger-check', {});
        return response.data;
    },

    // --- Upgrade Requests ---
    getPendingUpgradeRequests: async () => {
        const response = await api.get('/owner/upgrade-requests');
        return response.data;
    },

    approveUpgrade: async (requestId: string, notes: string) => {
        const response = await api.post(`/owner/upgrade-requests/${requestId}/approve`, { notes });
        return response.data;
    },

    rejectUpgrade: async (requestId: string, notes: string) => {
        const response = await api.post(`/owner/upgrade-requests/${requestId}/reject`, { notes });
        return response.data;
    },

    // --- Tenants ---
    getTenantsApproachingLimits: async (threshold = 80) => {
        const response = await api.get(`/owner/tenants/approaching-limits?threshold=${threshold}`);
        return response.data;
    },

    // --- Feature Flags ---
    getAllFeatures: async () => {
        const response = await api.get('/owner/features');
        return response.data;
    },

    getFeaturesForTenant: async (tenantId: string) => {
        const response = await api.get(`/owner/features/tenant/${tenantId}`);
        return response.data;
    },

    toggleFeatureGlobally: async (key: string, enabled: boolean) => {
        const response = await api.post(`/owner/features/${key}/toggle`, { enabled });
        return response.data;
    },

    setFeatureForTenant: async (tenantId: string, key: string, enabled: boolean, notes?: string) => {
        const response = await api.post(`/owner/features/${key}/tenant/${tenantId}`, { enabled, notes });
        return response.data;
    },

    removeFeatureOverride: async (tenantId: string, key: string) => {
        const response = await api.delete(`/owner/features/${key}/tenant/${tenantId}`);
        return response.data;
    },

    createFeatureFlag: async (data: Partial<FeatureFlag>) => {
        const response = await api.post('/owner/features', data);
        return response.data;
    },

    // --- Plans ---
    getAllPlans: async () => {
        const response = await api.get('/owner/plans');
        return response.data;
    },

    getPlanByKey: async (key: string) => {
        const response = await api.get(`/owner/plans/${key}`);
        return response.data;
    },

    createPlan: async (data: Partial<Plan>) => {
        const response = await api.post('/owner/plans', data);
        return response.data;
    },

    updatePlan: async (planId: string, data: Partial<Plan>) => {
        const response = await api.patch(`/owner/plans/${planId}`, data);
        return response.data;
    },

    // --- Roles & Permissions ---
    getAllRoles: async () => {
        const response = await api.get('/owner/roles');
        return response.data;
    },

    getAllPermissions: async () => {
        const response = await api.get('/owner/roles/permissions');
        return response.data;
    },

    createRole: async (data: Partial<Role> & { permissionKeys: string[] }) => {
        const response = await api.post('/owner/roles', data);
        return response.data;
    },

    updateRole: async (roleId: string, data: Partial<Role> & { permissionKeys?: string[] }) => {
        const response = await api.patch(`/owner/roles/${roleId}`, data);
        return response.data;
    },

    deleteRole: async (roleId: string) => {
        await api.delete(`/owner/roles/${roleId}`);
    },

    createPermission: async (data: Partial<Permission>) => {
        const response = await api.post('/owner/roles/permissions', data);
        return response.data;
    },

    updatePermission: async (id: string, data: Partial<Permission>) => {
        const response = await api.patch(`/owner/roles/permissions/${id}`, data);
        return response.data;
    },

    deletePermission: async (id: string) => {
        await api.delete(`/owner/roles/permissions/${id}`);
    },

    assignRoleToUser: async (userId: string, roleId: string) => {
        const response = await api.post(`/owner/roles/${roleId}/users/${userId}`, {});
        return response.data;
    },

    revokeRoleFromUser: async (userId: string, roleId: string) => {
        await api.delete(`/owner/roles/${roleId}/users/${userId}`);
    },

    getUserRoles: async (userId: string) => {
        const response = await api.get(`/owner/roles/users/${userId}`);
        return response.data;
    },

    // --- Audit Logs ---
    getAuditLogs: async (filters: any) => {
        const response = await api.get('/owner/audit-logs', filters);
        return response.data;
    },

    // --- Compliance ---
    getComplianceStats: async () => {
        const response = await api.get('/owner/compliance/stats');
        return response.data;
    },

    // --- Users ---
    searchUsers: async (params: { search?: string; role?: string; limit?: number; offset?: number }) => {
        const response = await api.get('/owner/users', params);
        return response.data;
    }
};

// Helper
function getDateForPeriod(period: string): string {
    const d = new Date();
    if (period === '7d') d.setDate(d.getDate() - 7);
    if (period === '30d') d.setDate(d.getDate() - 30);
    if (period === '90d') d.setDate(d.getDate() - 90);
    if (period === '1y') d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
}
