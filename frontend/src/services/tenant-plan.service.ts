import { api } from './api';

export interface PlanLimits {
    clients: number;
    coaches: number;
    sessionsPerMonth: number;
    locations: number;
    storageGB: number;
    smsPerMonth: number;
    emailPerMonth: number;
}

export interface Plan {
    key: string;
    name: string;
    limits: PlanLimits;
}

export interface UsageSnapshot {
    tenantId: string;
    planKey: string;
    usageTimestamp: string;
    clients: { current: number; limit: number; percentage: number };
    coaches: { current: number; limit: number; percentage: number };
    sessions: { current: number; limit: number; percentage: number }; // backward compatibility
    sessionsThisMonth: { current: number; limit: number; percentage: number };
    storageGB: { current: number; limit: number; percentage: number };
    smsThisMonth: { current: number; limit: number; percentage: number };
    emailThisMonth: { current: number; limit: number; percentage: number };
    isBlocked: boolean;
    blockReason?: string;
    daysUntilReset: number;
}

export interface PlanComparison {
    key: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    limits: PlanLimits;
    isCurrent: boolean;
}

export interface UpgradeRequest {
    id: string;
    tenantId: string;
    currentPlan: string;
    requestedPlan: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    reason: string;
    requestedAt: string;
    requesterId: string;
    requesterName?: string;
    reviewerNotes?: string;
    reviewedAt?: string;
    reviewedBy?: string;
}

export const tenantPlanService = {
    /**
     * Get current tenant usage and plan details
     */
    getUsage: async (): Promise<{ usage: UsageSnapshot; plan: Plan }> => {
        const response = await api.get('/tenant/usage');
        return response.data;
    },

    /**
     * Get all plans for comparison
     */
    getPlans: async (): Promise<PlanComparison[]> => {
        const response = await api.get('/tenant/usage/plans');
        // Backend returns { plans: Plan[], comparison: ... }
        // We need to map Plan[] to PlanComparison[] and fix limit keys
        const plans = response.data.plans || [];

        return plans.map((plan: any) => ({
            key: plan.key,
            name: plan.name,
            price: plan.price || 0,
            description: plan.description || '',
            features: plan.features || [],
            limits: {
                clients: plan.limits.maxClients,
                coaches: plan.limits.maxCoaches,
                sessionsPerMonth: plan.limits.maxSessionsPerMonth,
                locations: 1, // Defaulting as not in backend yet
                storageGB: plan.limits.storageGB,
                smsPerMonth: plan.limits.smsAllowance,
                emailPerMonth: plan.limits.emailAllowance,
            },
            isCurrent: false, // Calculated in component
        }));
    },

    /**
     * Submit an upgrade request
     */
    submitUpgradeRequest: async (requestedPlan: string, reason: string): Promise<UpgradeRequest> => {
        const response = await api.post('/tenant/upgrade-requests', { requestedPlan, reason });
        return response.data;
    },

    /**
     * Get pending upgrade request if any
     */
    getPendingRequest: async (): Promise<UpgradeRequest | null> => {
        const response = await api.get('/tenant/upgrade-requests/pending');
        return response.data;
    },

    /**
     * Get upgrade request history
     */
    getRequestHistory: async (): Promise<UpgradeRequest[]> => {
        const response = await api.get('/tenant/upgrade-requests/history');
        return response.data;
    },

    /**
     * Cancel a pending request
     */
    cancelRequest: async (requestId: string): Promise<void> => {
        await api.post(`/tenant/upgrade-requests/${requestId}/cancel`, {});
    },

    /**
     * Check if a plan downgrade is possible
     */
    checkDowngrade: async (planKey: string): Promise<{ compatible: boolean; violations: string[] }> => {
        const response = await api.post('/tenant/usage/check-downgrade', { planKey });
        return response.data;
    },
};
