import React from 'react';

interface UtilizationGaugeProps {
    label: string;
    value: number; // Percentage 0-100
    sessionCount?: number;
}

const UtilizationGauge: React.FC<UtilizationGaugeProps> = ({ label, value, sessionCount }) => {
    const getColor = () => {
        if (value >= 80) return '#10b981';
        if (value >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div
            style={{
                padding: '1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
            }}
        >
            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>
                {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                    style={{
                        position: 'relative',
                        width: '64px',
                        height: '64px',
                    }}
                >
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 64 64"
                        style={{ transform: 'rotate(-90deg)' }}
                    >
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="var(--border-color)"
                            strokeWidth="6"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke={getColor()}
                            strokeWidth="6"
                            strokeDasharray={`${(value / 100) * 176} 176`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                        }}
                    >
                        {value}%
                    </div>
                </div>
                {sessionCount !== undefined && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {sessionCount} sessions
                    </div>
                )}
            </div>
        </div>
    );
};

export default UtilizationGauge;
