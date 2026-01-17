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

interface InBodyTrendsChartKeys {
    data: InBodyScan[];
}

const InBodyTrendsChart: React.FC<InBodyTrendsChartKeys> = ({ data }) => {
    // Sort data by date ascending
    const sortedData = [...data]
        .sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime())
        .map(scan => ({
            ...scan,
            date: new Date(scan.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        }));

    if (data.length === 0) return <div>No data to display</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Weight & Muscle Mass Chart */}
            <div style={{ height: '300px', width: '100%' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Weight Composition</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Muscle (kg)', angle: 90, position: 'insideRight' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--color-text-primary)' }}
                        />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="weight" name="Weight" stroke="#8884d8" fillOpacity={1} fill="url(#colorWeight)" />
                        <Line yAxisId="right" type="monotone" dataKey="skeletalMuscleMass" name="Muscle Mass" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Body Fat % Chart */}
            <div style={{ height: '250px', width: '100%' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Body Fat Percentage</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--color-text-primary)' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="bodyFatPercentage" name="Body Fat %" stroke="#ff7300" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default InBodyTrendsChart;
