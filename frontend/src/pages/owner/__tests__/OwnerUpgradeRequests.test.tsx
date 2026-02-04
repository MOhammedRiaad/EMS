import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OwnerUpgradeRequests from '../OwnerUpgradeRequests';
import { ownerPortalService } from '../../../services/owner-portal.service';

// Mock the service
vi.mock('../../../services/owner-portal.service', () => ({
    ownerPortalService: {
        getPendingUpgradeRequests: vi.fn(),
        approveUpgrade: vi.fn(),
        rejectUpgrade: vi.fn(),
    },
}));

describe('OwnerUpgradeRequests', () => {
    const mockRequests = [
        {
            id: 'r1',
            tenantId: 't1',
            tenantName: 'Power Fitness',
            currentPlan: 'starter',
            requestedPlan: 'pro',
            status: 'pending',
            reason: 'Growing base',
            requestedAt: new Date().toISOString(),
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (ownerPortalService.getPendingUpgradeRequests as any).mockResolvedValue(mockRequests);
    });

    it('renders loading state initially', () => {
        render(<OwnerUpgradeRequests />);
        expect(screen.getByText(/Loading requests.../i)).toBeInTheDocument();
    });

    it('renders upgrade requests after loading', async () => {
        render(<OwnerUpgradeRequests />);

        await waitFor(() => {
            expect(screen.queryByText(/Loading requests.../i)).not.toBeInTheDocument();
        });

        expect(screen.getByText('Power Fitness')).toBeInTheDocument();
        expect(screen.getByText(/Growing base/i)).toBeInTheDocument();
        expect(screen.getByText('pro')).toBeInTheDocument();
    });

    it('shows action buttons and handles approval flow', async () => {
        render(<OwnerUpgradeRequests />);

        await waitFor(() => {
            expect(screen.getByText('Approve Upgrade')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Approve Upgrade'));

        // Should show note input and confirm button
        expect(screen.getByLabelText(/Optional Approval Note:/i)).toBeInTheDocument();
        const confirmBtn = screen.getByText('Confirm Approval');

        const noteInput = screen.getByPlaceholderText(/E.g., Approved as per conversation/i);
        fireEvent.change(noteInput, { target: { value: 'Good to go' } });

        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(ownerPortalService.approveUpgrade).toHaveBeenCalledWith('r1', 'Good to go');
        });
    });

    it('handles rejection flow with required note', async () => {
        render(<OwnerUpgradeRequests />);

        await waitFor(() => {
            expect(screen.getByText('Reject')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Reject'));

        const confirmBtn = screen.getByText('Confirm Rejection');
        expect(confirmBtn).toBeDisabled(); // Rejection note is required

        const noteInput = screen.getByPlaceholderText(/E.g., Need to verify payment info first/i);
        fireEvent.change(noteInput, { target: { value: 'Wait for billing' } });

        expect(confirmBtn).not.toBeDisabled();
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(ownerPortalService.rejectUpgrade).toHaveBeenCalledWith('r1', 'Wait for billing');
        });
    });

    it('renders empty state when no requests', async () => {
        (ownerPortalService.getPendingUpgradeRequests as any).mockResolvedValue([]);

        render(<OwnerUpgradeRequests />);

        await waitFor(() => {
            expect(screen.getByText(/All Caught Up!/i)).toBeInTheDocument();
        });
    });
});
