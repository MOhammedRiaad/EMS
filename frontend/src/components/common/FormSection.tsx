import React from 'react';

export interface FormSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    className?: string;
}

/**
 * A reusable form section component that groups related form fields
 * with an optional title, description, and collapsible behavior.
 */
export const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    children,
    collapsible = false,
    defaultCollapsed = false,
    className = ''
}) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    return (
        <div
            className={className}
            style={{
                backgroundColor: 'var(--color-bg-secondary)',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: '1rem'
            }}
        >
            {(title || description) && (
                <div
                    style={{
                        marginBottom: isCollapsed ? 0 : '1rem',
                        cursor: collapsible ? 'pointer' : 'default'
                    }}
                    onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
                >
                    {title && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: 'var(--color-text-primary)',
                                    margin: 0
                                }}
                            >
                                {title}
                            </h3>
                            {collapsible && (
                                <span
                                    style={{
                                        color: 'var(--color-text-muted)',
                                        transition: 'transform 0.2s',
                                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                                    }}
                                >
                                    ▼
                                </span>
                            )}
                        </div>
                    )}
                    {description && (
                        <p
                            style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-text-muted)',
                                marginTop: '0.25rem',
                                margin: 0
                            }}
                        >
                            {description}
                        </p>
                    )}
                </div>
            )}

            {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export interface FormRowProps {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    gap?: string;
}

/**
 * A form row component for laying out multiple fields horizontally.
 */
export const FormRow: React.FC<FormRowProps> = ({
    children,
    columns = 2,
    gap = '1rem'
}) => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap
            }}
        >
            {children}
        </div>
    );
};

export interface FormActionsProps {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
}

/**
 * A container for form action buttons (submit, cancel, etc.)
 */
export const FormActions: React.FC<FormActionsProps> = ({
    children,
    align = 'right'
}) => {
    const alignMap = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end'
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: alignMap[align],
                gap: '0.5rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
            }}
        >
            {children}
        </div>
    );
};

export default FormSection;
