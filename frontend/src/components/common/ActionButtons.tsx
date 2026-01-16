import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    showEdit?: boolean;
    showDelete?: boolean;
    size?: 'sm' | 'md';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onEdit,
    onDelete,
    showEdit = true,
    showDelete = true,
    size = 'sm'
}) => {
    const iconSize = size === 'sm' ? 14 : 16;
    const padding = size === 'sm' ? '0.375rem' : '0.5rem';

    const buttonStyle = {
        padding,
        borderRadius: 'var(--border-radius-md)',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease'
    };

    return (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
            {showEdit && onEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    style={{ ...buttonStyle, color: 'var(--color-primary)' }}
                    title="Edit"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Edit2 size={iconSize} />
                </button>
            )}
            {showDelete && onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{ ...buttonStyle, color: 'var(--color-danger)' }}
                    title="Delete"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Trash2 size={iconSize} />
                </button>
            )}
        </div>
    );
};

export default ActionButtons;
