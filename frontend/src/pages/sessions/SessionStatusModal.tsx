import React from 'react';
import Modal from '../../components/common/Modal';

interface SessionStatusModalProps {
    isOpen: boolean;
    statusAction: 'completed' | 'no_show' | 'cancelled' | null;
    cancelReason: string;
    setCancelReason: (reason: string) => void;
    showDeductChoice: boolean;
    deductSessionChoice: boolean | null;
    setDeductSessionChoice: (value: boolean) => void;
    saving: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px'
};

export const SessionStatusModal: React.FC<SessionStatusModalProps> = ({
    isOpen,
    statusAction,
    cancelReason,
    setCancelReason,
    showDeductChoice,
    deductSessionChoice,
    setDeductSessionChoice,
    saving,
    onConfirm,
    onClose
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Mark as ${statusAction?.replace('_', ' ')}`}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p>
                    Are you sure you want to mark this session as{' '}
                    <strong>{statusAction?.replace('_', ' ')}</strong>?
                </p>

                {statusAction === 'cancelled' && (
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Cancellation Reason (Optional)
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            style={inputStyle}
                            placeholder="Reason for cancellation..."
                        />

                        {showDeductChoice && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid var(--color-warning)',
                                borderRadius: 'var(--border-radius-md)'
                            }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={deductSessionChoice ?? false}
                                        onChange={(e) => setDeductSessionChoice(e.target.checked)}
                                    />
                                    <span style={{ fontSize: '0.875rem' }}>
                                        <strong>Deduct session from package</strong><br />
                                        <span style={{ color: 'var(--color-text-secondary)' }}>
                                            (Cancellation is within 48 hours of session time)
                                        </span>
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={saving}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--border-radius-md)',
                            opacity: saving ? 0.6 : 1
                        }}
                    >
                        {saving ? 'Updating...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SessionStatusModal;
