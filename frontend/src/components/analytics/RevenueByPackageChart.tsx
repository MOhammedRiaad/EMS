import React from 'react';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import type { RevenueByPackage } from '../../services/analytics.service';
import { useTheme } from '../../context/ThemeContext';

interface RevenueByPackageChartProps {
    data: RevenueByPackage[];
    height?: number;
}

const RevenueByPackageChart: React.FC<RevenueByPackageChartProps> = ({ data, height = 300 }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!data || data.length === 0) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                No package data available
            </div>
        );
    }

    // Prepare data with calculated fields if needed (though backend provides them)
    const chartData = data.map(item => ({
        ...item,
        sessionsSold: item.count * item.totalSessions // Calculate total sessions sold
    }));

    return (
        <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            height: height + 60
        }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Revenue & Sessions by Package</h3>
            <div style={{ width: '100%', height: height }}>
                <ResponsiveContainer>
                    <ComposedChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                        <XAxis type="number" xAxisId="revenue" orientation="top" tickFormatter={(value) => `€${value}`} stroke="var(--color-text-secondary)" fontSize={12} />
                        <XAxis type="number" xAxisId="sessions" orientation="bottom" stroke="#10b981" fontSize={12} />
                        <YAxis dataKey="packageName" type="category" width={100} stroke="var(--color-text-secondary)" fontSize={12} />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-bg-primary)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--color-text-primary)',
                            }}
                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                            formatter={(value: number | undefined, name: string | undefined) => {
                                if (name === 'Revenue') return [`€${(value || 0).toLocaleString()}`, name];
                                if (name === 'Sessions Sold') return [(value || 0), name];
                                return [value, name];
                            }}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    const dataItem = payload[0].payload as RevenueByPackage;
                                    return `${label} (€${Math.round(dataItem.costPerSession)}/session)`;
                                }
                                return label;
                            }}
                        />
                        <Legend />

                        <Bar dataKey="revenue" name="Revenue" barSize={20} fill="var(--color-primary)" radius={[0, 4, 4, 0]} xAxisId="revenue" />
                        <Bar dataKey="sessionsSold" name="Sessions Sold" barSize={10} fill="#10b981" radius={[0, 4, 4, 0]} xAxisId="sessions" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {data.map(item => (
                    <div key={item.packageId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{item.packageName}:</span>
                        <span>€{Math.round(item.costPerSession)}/session</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RevenueByPackageChart;
