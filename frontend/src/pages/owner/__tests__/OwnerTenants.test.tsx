import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OwnerTenants from '../OwnerTenants';
import { ownerPortalService } from '../../../services/owner-portal.service';

// Mock the service
vi.mock('../../../services/owner-portal.service', () => ({
    ownerPortalService: {
        getTenants: vi.fn(),
        impersonateTenant: vi.fn(),
    },
}));

describe('OwnerTenants', () => {
    const mockTenantsResponse = {
        items: [
            {
                id: 't1',
                name: 'Main Studio',
                status: 'active',
                plan: { key: 'pro', name: 'Pro Plan' },
                contactEmail: 'admin@main.com',
                createdAt: new Date().toISOString(),
                stats: { clients: 50, sessionsThisMonth: 120 },
            },
            {
                id: 't2',
                name: 'Trial Studio',
                status: 'trial',
                plan: { key: 'trial', name: 'Trial Plan' },
                contactEmail: 'admin@trial.com',
                createdAt: new Date().toISOString(),
                stats: { clients: 5, sessionsThisMonth: 10 },
            }
        ],
        total: 2,
        page: 1,
        limit: 10
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (ownerPortalService.getTenants as any).mockResolvedValue(mockTenantsResponse);
        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
        // Mock window.location.href
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: '' },
        });
    });

    it('renders loading state initially', () => {
        render(
            <MemoryRouter>
                <OwnerTenants />
            </MemoryRouter>
        );
        expect(screen.getByText(/Loading tenants.../i)).toBeInTheDocument();
    });

    it('renders tenant list after loading', async () => {
        render(
            <MemoryRouter>
                <OwnerTenants />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Loading tenants.../i)).not.toBeInTheDocument();
        });

        expect(screen.getByText('Main Studio')).toBeInTheDocument();
        expect(screen.getByText('Trial Studio')).toBeInTheDocument();
        expect(screen.getByText('admin@main.com')).toBeInTheDocument();
        expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });

    it('filters tenants when typing in search', async () => {
        render(
            <MemoryRouter>
                <OwnerTenants />
            </MemoryRouter>
        );

        const searchInput = screen.getByPlaceholderText(/Search tenants.../i);
        fireEvent.change(searchInput, { target: { value: 'Main' } });

        await waitFor(() => {
            expect(ownerPortalService.getTenants).toHaveBeenCalledWith(expect.objectContaining({
                search: 'Main'
            }));
        });
    });

    it('triggers impersonation when clicking login button', async () => {
        (ownerPortalService.impersonateTenant as any).mockResolvedValue({ token: 'mock-token' });

        render(
            <MemoryRouter>
                <OwnerTenants />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Main Studio')).toBeInTheDocument();
        });

        const impersonateButtons = screen.getAllByTitle(/Log in as Admin/i);
        fireEvent.click(impersonateButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(ownerPortalService.impersonateTenant).toHaveBeenCalledWith('t1');
    });

    it('renders empty state when no tenants returned', async () => {
        (ownerPortalService.getTenants as any).mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });

        render(
            <MemoryRouter>
                <OwnerTenants />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No tenants found/i)).toBeInTheDocument();
        });
    });
});
