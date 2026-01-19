import React from 'react';

export interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * A reusable form field wrapper that provides consistent styling for labels,
 * error messages, and hints across all forms.
 */
export const FormField: React.FC<FormFieldProps> = ({
    label,
    required = false,
    error,
    hint,
    children,
    className = ''
}) => {
    return (
        <div className={className}>
            <label
                style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)'
                }}
            >
                {label}
                {required && <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>}
            </label>
            {children}
            {error && (
                <p style={{
                    marginTop: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-danger)'
                }}>
                    {error}
                </p>
            )}
            {hint && !error && (
                <p style={{
                    marginTop: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)'
                }}>
                    {hint}
                </p>
            )}
        </div>
    );
};

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

/**
 * A styled input component that matches the design system.
 */
export const FormInput: React.FC<FormInputProps> = ({ hasError, style, ...props }) => {
    const baseStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--border-radius-md)',
        border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--border-color)'}`,
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        transition: 'border-color 0.2s',
        ...style
    };

    return <input style={baseStyle} {...props} />;
};

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean;
}

/**
 * A styled select component that matches the design system.
 */
export const FormSelect: React.FC<FormSelectProps> = ({ hasError, style, children, ...props }) => {
    const baseStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--border-radius-md)',
        border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--border-color)'}`,
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        transition: 'border-color 0.2s',
        ...style
    };

    return <select style={baseStyle} {...props}>{children}</select>;
};

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
}

/**
 * A styled textarea component that matches the design system.
 */
export const FormTextarea: React.FC<FormTextareaProps> = ({ hasError, style, ...props }) => {
    const baseStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--border-radius-md)',
        border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--border-color)'}`,
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        minHeight: '100px',
        resize: 'vertical',
        transition: 'border-color 0.2s',
        ...style
    };

    return <textarea style={baseStyle} {...props} />;
};

export default FormField;
