import React, { useEffect, useState } from 'react';
import { DollarSign, Users, UserCheck, Calendar, TrendingUp, BarChart3, Clock, Hourglass, Wallet, AlertCircle, Download } from 'lucide-react';
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
    type CashFlow,
    type OutstandingPayment,
    type WaitingListStats,
    type Utilization,
    type LeadAnalytics,
    type RevenueForecast,
} from '../../services/analytics.service';

type TabType = 'overview' | 'revenue' | 'clients' | 'operations' | 'financial' | 'waiting-list' | 'leads';

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
    const [waitingListStats, setWaitingListStats] = useState<WaitingListStats | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
    const [outstandingPayments, setOutstandingPayments] = useState<OutstandingPayment[]>([]);

    // New Data State
    const [leadAnalytics, setLeadAnalytics] = useState<LeadAnalytics | null>(null);
    const [revenueForecast, setRevenueForecast] = useState<RevenueForecast | null>(null);

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
                analyticsService.getWaitingListStats(params),
                analyticsService.getCashFlow(params),
                analyticsService.getOutstandingPayments(),
                analyticsService.getLeadAnalytics(params),
                analyticsService.getRevenueForecast(),
            ]);

            const [
                revenueResult,
                revenueDataResult,
                clientsResult,
                retentionResult,
                coachesResult,
                sessionsResult,
                roomsResult,
                waitingListResult,
                cashFlowResult,
                outstandingResult,
                leadsResult,
                forecastResult,
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

            if (waitingListResult.status === 'fulfilled') setWaitingListStats(waitingListResult.value);
            if (cashFlowResult.status === 'fulfilled') setCashFlow(cashFlowResult.value);
            if (outstandingResult.status === 'fulfilled') setOutstandingPayments(outstandingResult.value);

            if (leadsResult.status === 'fulfilled') setLeadAnalytics(leadsResult.value);
            // Forecast might fail if not enough data, handle gracefully
            if (forecastResult.status === 'fulfilled') setRevenueForecast(forecastResult.value);

        } catch (error) {
            console.error('Unexpected error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return typeof val === 'string' ? `"${val}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExport = () => {
        const timestamp = new Date().toISOString().split('T')[0];

        switch (activeTab) {
            case 'revenue':
                downloadCSV(revenueByPeriod, `revenue_${timestamp}.csv`);
                break;
            case 'clients':
                const clientData = clientSummary ? [{
                    ...clientSummary,
                    retentionRate: clientRetention?.retentionRate,
                    retained: clientRetention?.retained
                }] : [];
                downloadCSV(clientData, `clients_${timestamp}.csv`);
                break;
            case 'operations':
                downloadCSV(roomUtilization, `room_utilization_${timestamp}.csv`);
                break;
            case 'financial':
                downloadCSV(outstandingPayments, `outstanding_payments_${timestamp}.csv`);
                break;
            case 'waiting-list':
                if (waitingListStats) {
                    downloadCSV([waitingListStats], `waiting_list_${timestamp}.csv`);
                }
                break;
            default:
                if (revenueSummary) {
                    downloadCSV([revenueSummary], `overview_${timestamp}.csv`);
                }
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { id: 'revenue', label: 'Revenue', icon: <DollarSign size={16} /> },
        { id: 'financial', label: 'Financial', icon: <Wallet size={16} /> },
        { id: 'clients', label: 'Clients', icon: <Users size={16} /> },
        { id: 'leads', label: 'Leads', icon: <UserCheck size={16} /> },
        { id: 'waiting-list', label: 'Waiting List', icon: <Hourglass size={16} /> },
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        }}
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <DateRangeFilter value={dateRange} onChange={setDateRange} />
                </div>
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

                    {revenueForecast && (
                        <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <TrendingUp size={20} color="var(--color-primary)" />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Revenue Forecast</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Projected for Next Month ({new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('default', { month: 'long' })})
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                        €{revenueForecast.forecast.toLocaleString()}
                                        <span style={{ fontSize: '0.875rem', color: revenueForecast.trend === 'up' ? '#10b981' : revenueForecast.trend === 'down' ? '#ef4444' : 'var(--color-text-secondary)', fontWeight: 500 }}>
                                            {revenueForecast.trend === 'up' ? '↗' : revenueForecast.trend === 'down' ? '↘' : '→'} {Math.abs(revenueForecast.growthRate).toFixed(1)}% growth
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
                                    Based on linear regression of last 6 months. Confidence: {revenueForecast.confidence === 'low' ? 'Low (insufficient data)' : 'Normal'}.
                                </div>
                            </div>
                        </div>
                    )}
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

            {activeTab === 'financial' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <MetricCard
                            title="Total Outstanding"
                            value={`€${outstandingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`}
                            subtitle={`${outstandingPayments.length} pending payments`}
                            icon={<AlertCircle size={18} color="#ef4444" />}
                        />
                        <MetricCard
                            title="Cash Flow (Period)"
                            value={`€${cashFlow.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}`}
                            icon={<Wallet size={18} color="var(--color-primary)" />}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        {/* Reuse RevenueChart for Cash Flow by mapping data */}
                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Cash Flow Trend</h3>
                            <RevenueChart
                                data={cashFlow.map(c => ({ period: c.period, revenue: c.amount, count: 0 }))}
                                height={300}
                            />
                        </div>

                        {outstandingPayments.length > 0 && (
                            <div
                                style={{
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--border-radius-lg)',
                                    border: '1px solid var(--border-color)',
                                    padding: '1.5rem',
                                    overflow: 'hidden'
                                }}
                            >
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Outstanding Payments</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem 0', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Client</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Package</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                                                <th style={{ padding: '0.75rem 0', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {outstandingPayments.map((payment) => (
                                                <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '0.75rem 0' }}>{payment.clientName}</td>
                                                    <td style={{ padding: '0.75rem 0' }}>{payment.packageName}</td>
                                                    <td style={{ padding: '0.75rem 0' }}>{new Date(payment.purchaseDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 500 }}>€{payment.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'waiting-list' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <MetricCard
                            title="Total Entries"
                            value={waitingListStats?.total ?? 0}
                            icon={<Hourglass size={18} color="var(--color-primary)" />}
                        />
                        <MetricCard
                            title="Converted"
                            value={waitingListStats?.converted ?? 0}
                            icon={<UserCheck size={18} color="#10b981" />}
                        />
                        <MetricCard
                            title="Pending"
                            value={waitingListStats?.pending ?? 0}
                            icon={<Clock size={18} color="#f59e0b" />}
                        />
                        <MetricCard
                            title="Conversion Rate"
                            value={`${waitingListStats?.conversionRate ?? 0}%`}
                            icon={<TrendingUp size={18} color="#3b82f6" />}
                        />
                    </div>

                    <div
                        style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--border-radius-lg)',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: 'var(--color-text-secondary)'
                        }}
                    >
                        <p>Detailed waiting list management can be found in the Waiting List module.</p>
                    </div>
                </>
            )}

            {activeTab === 'leads' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <MetricCard
                            title="Total Leads"
                            value={leadAnalytics?.total ?? 0}
                            icon={<Users size={18} color="var(--color-primary)" />}
                        />
                        <MetricCard
                            title="Converted Leads"
                            value={leadAnalytics?.converted ?? 0}
                            icon={<UserCheck size={18} color="#10b981" />}
                        />
                        <MetricCard
                            title="Conversion Rate"
                            value={`${leadAnalytics?.conversionRate ?? 0}%`}
                            icon={<TrendingUp size={18} color="#3b82f6" />}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        {/* Source Breakdown */}
                        <div
                            style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--border-radius-lg)',
                                border: '1px solid var(--border-color)',
                                padding: '1.5rem',
                            }}
                        >
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Lead Sources</h3>
                            {leadAnalytics?.sources && leadAnalytics.sources.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {leadAnalytics.sources.map((source) => (
                                        <div key={source.source} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                                                <span style={{ fontSize: '0.875rem' }}>{source.source}</span>
                                            </div>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{source.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No source data available available for this period.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
