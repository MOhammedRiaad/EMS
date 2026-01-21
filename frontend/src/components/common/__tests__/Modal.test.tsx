import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

describe('Modal', () => {
    it('should not render when isOpen is false', () => {
        render(
            <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
                <p>Content</p>
            </Modal>
        );

        expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
                <p>Modal content here</p>
            </Modal>
        );

        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal content here')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <p>Content</p>
            </Modal>
        );

        const closeButton = screen.getByRole('button');
        await user.click(closeButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should render children correctly', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
                <form>
                    <input type="text" placeholder="Enter name" />
                    <button type="submit">Submit</button>
                </form>
            </Modal>
        );

        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should display the title', () => {
        render(
            <Modal isOpen={true} onClose={vi.fn()} title="My Custom Title">
                <p>Content</p>
            </Modal>
        );

        expect(screen.getByRole('heading', { name: 'My Custom Title' })).toBeInTheDocument();
    });
});
