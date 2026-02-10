import React, { useMemo } from 'react';
import type { UtilizationHeatmapItem } from '../../services/analytics.service';
import { useTheme } from '../../context/ThemeContext';

interface UtilizationHeatmapProps {
    data: UtilizationHeatmapItem[];
}

const UtilizationHeatmap: React.FC<UtilizationHeatmapProps> = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const maxCount = useMemo(() => {
        return Math.max(...data.map(item => item.count), 0);
    }, [data]);

    // Group by day for easier rendering
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getIntensityColor = (count: number) => {
        if (count === 0) return 'transparent';
        const intensity = maxCount > 0 ? count / maxCount : 0;
        // Blue scale
        return `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`;
    };

    const getItem = (dayIndex: number, hour: number) => {
        return data.find(d => d.dayIndex === dayIndex && d.hour === hour);
    };

    if (!data || data.length === 0) {
        return (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                No heatmap data available
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            overflowX: 'auto'
        }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Session Utilization Heatmap</h3>

            <div style={{ minWidth: '600px' }}>
                {/* Header Row (Hours) */}
                <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(24, 1fr)', gap: '2px', marginBottom: '4px' }}>
                    <div /> {/* Empty corner */}
                    {hours.map(h => (
                        <div key={h} style={{ fontSize: '10px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            {h}
                        </div>
                    ))}
                </div>

                {/* Data Rows */}
                {days.map((day, dayIndex) => (
                    <div key={day} style={{ display: 'grid', gridTemplateColumns: '100px repeat(24, 1fr)', gap: '2px', marginBottom: '2px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                            {day}
                        </div>
                        {hours.map(hour => {
                            const item = getItem(dayIndex, hour);
                            const count = item?.count || 0;
                            return (
                                <div
                                    key={hour}
                                    title={`${day} ${hour}:00 - ${count} sessions`}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundColor: getIntensityColor(count),
                                        borderRadius: '2px',
                                        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <span>Less</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '2px' }} />
                    <div style={{ width: 12, height: 12, backgroundColor: 'rgba(59, 130, 246, 0.4)', borderRadius: '2px' }} />
                    <div style={{ width: 12, height: 12, backgroundColor: 'rgba(59, 130, 246, 0.7)', borderRadius: '2px' }} />
                    <div style={{ width: 12, height: 12, backgroundColor: 'rgba(59, 130, 246, 1.0)', borderRadius: '2px' }} />
                </div>
                <span>More</span>
            </div>
        </div>
    );
};

export default UtilizationHeatmap;
