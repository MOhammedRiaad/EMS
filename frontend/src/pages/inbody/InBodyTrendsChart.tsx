import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Area
} from 'recharts';
import type { InBodyScan } from '../../services/inbody.service';
import { useTheme } from '../../context/ThemeContext';

interface InBodyTrendsChartKeys {
    data: InBodyScan[];
}

const InBodyTrendsChart: React.FC<InBodyTrendsChartKeys> = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Chart Colors
    const gridColor = isDark ? '#334155' : '#e5e7eb';
    const axisTextColor = isDark ? '#94a3b8' : '#6b7280';
    const tooltipBg = isDark ? 'bg-slate-800' : 'bg-white';
    const tooltipBorder = isDark ? 'border-slate-700' : 'border-gray-100';
    const tooltipText = isDark ? 'text-white' : 'text-gray-900';

    // Sort data by date ascending
    const sortedData = [...data]
        .sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime())
        .map(scan => ({
            ...scan,
            date: new Date(scan.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        }));

    if (data.length === 0) return <div className="text-center p-4 text-gray-500 dark:text-gray-400">No data to display</div>;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${tooltipBg} p-3 border ${tooltipBorder} shadow-lg rounded-lg text-sm`}>
                    <p className={`font-bold ${tooltipText} mb-2`}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span>{entry.name}: {entry.value}{entry.name.includes('%') ? '%' : 'kg'}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Weight & Muscle Mass Chart */}
            <div className="h-72 w-full bg-white dark:bg-slate-900 rounded-xl p-2 transition-colors">
                <h4 className="text-center mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Weight vs Muscle Mass</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: axisTextColor }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#3b82f6"
                            tick={{ fontSize: 10, fill: '#3b82f6' }}
                            axisLine={false}
                            tickLine={false}
                            width={35}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#10b981"
                            tick={{ fontSize: 10, fill: '#10b981' }}
                            axisLine={false}
                            tickLine={false}
                            width={35}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="weight"
                            name="Weight"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorWeight)"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="skeletalMuscleMass"
                            name="Muscle Mass"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Body Fat % Chart */}
            <div className="h-64 w-full bg-white dark:bg-slate-900 rounded-xl p-2 transition-colors">
                <h4 className="text-center mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Body Fat %</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: axisTextColor }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            domain={['dataMin - 2', 'dataMax + 2']}
                            tick={{ fontSize: 10, fill: '#f59e0b' }}
                            axisLine={false}
                            tickLine={false}
                            width={35}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey="bodyFatPercentage"
                            name="Body Fat %"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default InBodyTrendsChart;
