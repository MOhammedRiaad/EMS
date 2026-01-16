import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    loading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    {isDestructive && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '50%',
                            padding: '0.5rem',
                            flexShrink: 0
                        }}>
                            <AlertTriangle size={20} color="var(--color-danger)" />
                        </div>
                    )}
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {message}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: 'none',
                            backgroundColor: isDestructive ? 'var(--color-danger)' : 'var(--color-primary)',
                            color: 'white',
                            cursor: 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Please wait...' : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
