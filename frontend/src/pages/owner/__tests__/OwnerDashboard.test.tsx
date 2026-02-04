import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OwnerDashboard from '../OwnerDashboard';
import { ownerPortalService } from '../../../services/owner-portal.service';

// Mock the service
vi.mock('../../../services/owner-portal.service', () => ({
    ownerPortalService: {
        getAnalytics: vi.fn(),
        getAlerts: vi.fn(),
        triggerSystemCheck: vi.fn(),
    },
}));

describe('OwnerDashboard', () => {
    const mockAnalytics = {
        revenue: {
            totalRevenue: 15000,
            revenueByPeriod: [],
            projectedMonthly: 20000,
        },
        usage: {
            totalSessions: 500,
            avgSessionsPerTenant: 12.5,
            sessionsByDay: [],
            peakHour: 14,
        },
        growth: {
            newTenantsThisMonth: 5,
            newClientsThisMonth: 120,
            tenantGrowthRate: 15,
            churnRate: 2,
        },
        engagement: {
            activeTenants7d: 45,
            avgLoginsPerTenant: 8,
        },
    };

    const mockAlerts = [
        {
            id: '1',
            title: 'Low Storage Alert',
            message: 'Tenant X is low on storage',
            severity: 'warning',
            category: 'usage',
            createdAt: new Date().toISOString(),
            acknowledged: false,
        },
        {
            id: '2',
            title: 'Critical DB Error',
            message: 'Connection lost to secondary',
            severity: 'critical',
            category: 'system',
            createdAt: new Date().toISOString(),
            acknowledged: false,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (ownerPortalService.getAnalytics as any).mockResolvedValue(mockAnalytics);
        (ownerPortalService.getAlerts as any).mockResolvedValue(mockAlerts);
    });

    it('renders loading state initially', () => {
        render(
            <MemoryRouter>
                <OwnerDashboard />
            </MemoryRouter>
        );
        expect(screen.getByText(/Loading dashboard.../i)).toBeInTheDocument();
    });

    it('renders KPI cards with analytic data', async () => {
        render(
            <MemoryRouter>
                <OwnerDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Loading dashboard.../i)).not.toBeInTheDocument();
        });

        // Check revenue
        expect(screen.getByText('$15,000')).toBeInTheDocument();

        // Check active tenants
        expect(screen.getByText('45')).toBeInTheDocument();

        // Check sessions per tenant
        expect(screen.getByText('13')).toBeInTheDocument(); // 12.5 rounded to 13

        // Check peak hour
        expect(screen.getByText('14:00')).toBeInTheDocument();
    });

    it('renders system alerts', async () => {
        render(
            <MemoryRouter>
                <OwnerDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Low Storage Alert')).toBeInTheDocument();
            expect(screen.getByText('Critical DB Error')).toBeInTheDocument();
        });

        expect(screen.getByText('Tenant X is low on storage')).toBeInTheDocument();
        expect(screen.getByText('Connection lost to secondary')).toBeInTheDocument();
    });

    it('renders no alerts message when alerts array is empty', async () => {
        (ownerPortalService.getAlerts as any).mockResolvedValue([]);

        render(
            <MemoryRouter>
                <OwnerDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No active alerts/i)).toBeInTheDocument();
        });
    });
});
