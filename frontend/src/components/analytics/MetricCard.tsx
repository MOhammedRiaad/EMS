import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number; // Percentage change
    icon?: React.ReactNode;
    color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'var(--color-primary)',
}) => {
    const getTrendIcon = () => {
        if (trend === undefined) return null;
        if (trend > 0) return <TrendingUp size={14} color="#10b981" />;
        if (trend < 0) return <TrendingDown size={14} color="#ef4444" />;
        return <Minus size={14} color="#6b7280" />;
    };

    const getTrendColor = () => {
        if (trend === undefined) return 'var(--color-text-secondary)';
        if (trend > 0) return '#10b981';
        if (trend < 0) return '#ef4444';
        return '#6b7280';
    };

    return (
        <div
            style={{
                padding: '1.25rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {title}
                </span>
                {icon && (
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: `${color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </div>
                )}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {value}
            </div>
            {(subtitle || trend !== undefined) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {trend !== undefined && (
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: getTrendColor(),
                            }}
                        >
                            {getTrendIcon()}
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                    {subtitle && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default MetricCard;
