import React from 'react';

interface DateRangeFilterProps {
    value: string;
    onChange: (value: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
    const options = [
        { value: '7', label: 'Last 7 days' },
        { value: '30', label: 'Last 30 days' },
        { value: '90', label: 'Last 90 days' },
        { value: '365', label: 'Last year' },
    ];

    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: value === option.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                        color: value === option.value ? 'white' : 'var(--color-text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default DateRangeFilter;
