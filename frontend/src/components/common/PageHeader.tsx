import React from 'react';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actionLabel, onAction }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
        }}>
            <div>
                <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.025em'
                }}>{title}</h1>
                {description && (
                    <p style={{
                        color: 'var(--color-text-secondary)',
                        marginTop: '0.25rem'
                    }}>{description}</p>
                )}
            </div>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--border-radius-md)',
                        fontWeight: 500,
                        transition: 'background-color 0.2s',
                        border: '1px solid transparent'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
                >
                    <Plus size={18} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default PageHeader;
