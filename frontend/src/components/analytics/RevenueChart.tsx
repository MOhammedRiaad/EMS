import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
    data: Array<{
        period: string;
        revenue: number;
        count?: number;
    }>;
    height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, height = 300 }) => {
    const formatCurrency = (value: number) => `€${value.toLocaleString()}`;

    return (
        <div
            style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '1rem',
            }}
        >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Revenue'] as [string, string]}
                        contentStyle={{
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
