import React, { useEffect, useState } from 'react';
import { DollarSign, Users, UserCheck, Calendar, TrendingUp, BarChart3, Clock } from 'lucide-react';
import {
    MetricCard,
    DateRangeFilter,
    RevenueChart,
    CoachPerformanceChart,
    UtilizationGauge,
} from '../../components/analytics';
import {
    analyticsService,
    type RevenueSummary,
    type RevenueByPeriod,
    type ClientSummary,
    type ClientRetention,
    type CoachPerformance,
    type SessionStats,
    type Utilization,
} from '../../services/analytics.service';

type TabType = 'overview' | 'revenue' | 'clients' | 'operations';

const Analytics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [dateRange, setDateRange] = useState('30');
    const [loading, setLoading] = useState(true);

    // Data state
    const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
    const [revenueByPeriod, setRevenueByPeriod] = useState<RevenueByPeriod[]>([]);
    const [clientSummary, setClientSummary] = useState<ClientSummary | null>(null);
    const [clientRetention, setClientRetention] = useState<ClientRetention | null>(null);
    const [coachPerformance, setCoachPerformance] = useState<CoachPerformance[]>([]);
    const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
    const [roomUtilization, setRoomUtilization] = useState<Utilization[]>([]);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const days = parseInt(dateRange);
            const from = new Date();
            from.setDate(from.getDate() - days);
            const params = {
                from: from.toISOString(),
                to: new Date().toISOString(),
                period: days <= 7 ? 'day' as const : days <= 30 ? 'week' as const : 'month' as const,
            };

            const results = await Promise.allSettled([
                analyticsService.getRevenueSummary(),
                analyticsService.getRevenueByPeriod(params),
                analyticsService.getClientSummary(),
                analyticsService.getClientRetention(),
                analyticsService.getCoachPerformance(params),
                analyticsService.getSessionStats(params),
                analyticsService.getRoomUtilization(params),
            ]);

            const [
                revenueResult,
                revenueDataResult,
                clientsResult,
                retentionResult,
                coachesResult,
                sessionsResult,
                roomsResult,
            ] = results;

            if (revenueResult.status === 'fulfilled') setRevenueSummary(revenueResult.value);
            if (revenueDataResult.status === 'fulfilled') setRevenueByPeriod(revenueDataResult.value);
            if (clientsResult.status === 'fulfilled') setClientSummary(clientsResult.value);
            if (retentionResult.status === 'fulfilled') setClientRetention(retentionResult.value);

            if (coachesResult.status === 'fulfilled') {
                setCoachPerformance(coachesResult.value);
            } else {
                console.error('Failed to load coach performance:', coachesResult.reason);
                setCoachPerformance([]);
            }

            if (sessionsResult.status === 'fulfilled') setSessionStats(sessionsResult.value);

            if (roomsResult.status === 'fulfilled') {
                setRoomUtilization(roomsResult.value);
            } else {
                setRoomUtilization([]);
            }

        } catch (error) {
            console.error('Unexpected error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { id: 'revenue', label: 'Revenue', icon: <DollarSign size={16} /> },
        { id: 'clients', label: 'Clients', icon: <Users size={16} /> },
        { id: 'operations', label: 'Operations', icon: <Clock size={16} /> },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div
                    className="spinner"
                    style={{
                        border: '4px solid rgba(0,0,0,0.1)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        borderLeftColor: 'var(--color-primary)',
                        animation: 'spin 1s linear infinite',
                    }}
                />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Analytics</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        Track performance and insights
                    </p>
                </div>
                <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.25rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    padding: '0.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    width: 'fit-content',
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: activeTab === tab.id ? 'var(--color-bg-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === tab.id ? 600 : 500,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Key Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <MetricCard
                            title="Month to Date Revenue"
                            value={`€${revenueSummary?.mtd?.toLocaleString() ?? 0}`}
                            trend={revenueSummary?.growthPercent}
                            subtitle="vs last month"
                            icon={<DollarSign size={18} color="var(--color-primary)" />}
                        />
                        <MetricCard
                            title="Active Clients"
                            value={clientSummary?.active ?? 0}
                            subtitle={`+${clientSummary?.newLast30Days ?? 0} new this month`}
                            icon={<Users size={18} color="#10b981" />}
                        />
                        <MetricCard
                            title="Sessions Completed"
                            value={sessionStats?.completed ?? 0}
                            subtitle={`${sessionStats?.completionRate ?? 0}% completion rate`}
                            icon={<Calendar size={18} color="#3b82f6" />}
                        />
                        <MetricCard
                            title="Retention Rate"
                            value={`${clientRetention?.retentionRate ?? 0}%`}
                            subtitle={`${clientRetention?.retained ?? 0} returning clients`}
                            icon={<TrendingUp size={18} color="#f59e0b" />}
                        />
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <RevenueChart data={revenueByPeriod} />
                        <CoachPerformanceChart data={coachPerformance.slice(0, 5)} height={300} />
                    </div>
                </>
            )}

            {activeTab === 'revenue' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <MetricCard
                            title="Total Revenue"
                            value={`€${revenueSummary?.total?.toLocaleString() ?? 0}`}
                            icon={<DollarSign size={18} color="var(--color-primary)" />}
                        />
                        <MetricCard
                            title="Month to Date"
                            value={`€${revenueSummary?.mtd?.toLocaleString() ?? 0}`}
                            trend={revenueSummary?.growthPercent}
                            icon={<TrendingUp size={18} color="#10b981" />}
                        />
                        <MetricCard
                            title="Year to Date"
                            value={`€${revenueSummary?.ytd?.toLocaleString() ?? 0}`}
                            icon={<BarChart3 size={18} color="#3b82f6" />}
                        />
                        <MetricCard
                            title="Last Month"
                            value={`€${revenueSummary?.lastMonth?.toLocaleString() ?? 0}`}
                            icon={<Calendar size={18} color="#6b7280" />}
                        />
                    </div>
                    <RevenueChart data={revenueByPeriod} height={400} />
                </>
            )}

            {activeTab === 'clients' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <MetricCard
                            title="Total Clients"
                            value={clientSummary?.total ?? 0}
                            icon={<Users size={18} color="var(--color-primary)" />}
                        />
                        <MetricCard
                            title="Active Clients"
                            value={clientSummary?.active ?? 0}
                            icon={<UserCheck size={18} color="#10b981" />}
                        />
                        <MetricCard
                            title="New This Month"
                            value={clientSummary?.newLast30Days ?? 0}
                            icon={<TrendingUp size={18} color="#3b82f6" />}
                        />
                        <MetricCard
                            title="Retention Rate"
                            value={`${clientRetention?.retentionRate ?? 0}%`}
                            icon={<BarChart3 size={18} color="#f59e0b" />}
                        />
                    </div>

                    <div
                        style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--border-radius-lg)',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                        }}
                    >
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Client Retention</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                                    {clientRetention?.activeLast30Days ?? 0}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Active (Last 30 days)
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>
                                    {clientRetention?.retained ?? 0}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Returning Clients
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {clientRetention?.retentionRate ?? 0}%
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Retention Rate
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'operations' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <MetricCard
                            title="Total Sessions"
                            value={sessionStats?.total ?? 0}
                            icon={<Calendar size={18} color="var(--color-primary)" />}
                        />
                        <MetricCard
                            title="Completed"
                            value={sessionStats?.completed ?? 0}
                            icon={<UserCheck size={18} color="#10b981" />}
                        />
                        <MetricCard
                            title="Cancelled"
                            value={sessionStats?.cancelled ?? 0}
                            icon={<Users size={18} color="#ef4444" />}
                        />
                        <MetricCard
                            title="Completion Rate"
                            value={`${sessionStats?.completionRate ?? 0}%`}
                            icon={<TrendingUp size={18} color="#f59e0b" />}
                        />
                    </div>

                    <div
                        style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--border-radius-lg)',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                        }}
                    >
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Room Utilization</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                            {roomUtilization.map((room) => (
                                <UtilizationGauge
                                    key={room.id}
                                    label={room.name}
                                    value={room.utilizationPercent}
                                    sessionCount={room.sessionCount}
                                />
                            ))}
                        </div>
                    </div>

                    <CoachPerformanceChart data={coachPerformance} height={350} />
                </>
            )}
        </div>
    );
};

export default Analytics;
