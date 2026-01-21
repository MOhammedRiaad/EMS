import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        message: 'Are you sure you want to proceed?',
    };

    it('should not render when isOpen is false', () => {
        render(<ConfirmDialog {...defaultProps} isOpen={false} />);

        expect(screen.queryByText('Are you sure you want to proceed?')).not.toBeInTheDocument();
    });

    it('should render with default title and buttons', () => {
        render(<ConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should render with custom title and button labels', () => {
        render(
            <ConfirmDialog
                {...defaultProps}
                title="Delete Item"
                confirmLabel="Delete"
                cancelLabel="Keep"
            />
        );

        expect(screen.getByText('Delete Item')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();

        render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should show warning icon when isDestructive is true', () => {
        render(<ConfirmDialog {...defaultProps} isDestructive={true} />);

        // The AlertTriangle icon should be rendered
        const icon = document.querySelector('svg');
        expect(icon).toBeInTheDocument();
    });

    it('should show loading state and disable buttons when loading', () => {
        render(<ConfirmDialog {...defaultProps} loading={true} />);

        expect(screen.getByRole('button', { name: 'Please wait...' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('should not be in loading state by default', () => {
        render(<ConfirmDialog {...defaultProps} />);

        expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
    });
});
