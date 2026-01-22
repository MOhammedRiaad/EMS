import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface CoachPerformanceChartProps {
    data: Array<{
        coachId: string;
        name: string;
        sessionCount: number;
    }>;
    height?: number;
}

const COLORS = ['#8B5CF6', '#6366F1', '#3B82F6', '#0EA5E9', '#14B8A6', '#10B981'];

const CoachPerformanceChart: React.FC<CoachPerformanceChartProps> = ({ data, height = 300 }) => {
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
                Coach Performance
            </h3>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                        tickLine={false}
                        axisLine={false}
                        width={75}
                    />
                    <Tooltip
                        formatter={(value: number | undefined) => [`${value ?? 0} sessions`, 'Sessions']}
                        contentStyle={{
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                        }}
                    />
                    <Bar dataKey="sessionCount" radius={[0, 4, 4, 0]}>
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CoachPerformanceChart;
