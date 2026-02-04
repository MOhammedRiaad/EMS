import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import {
    Users,
    Activity,
    DollarSign,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { GlobalAnalytics } from '../../services/owner-portal.service';

const OwnerAnalytics: React.FC = () => {
    const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [data, setData] = useState<GlobalAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                const analyticsData = await ownerPortalService.getAnalytics(period);
                setData(analyticsData);
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, [period]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-gray-500">No analytics data available</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-600" /> Analytics & Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Platform-wide performance metrics</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700 flex">
                    {(['7d', '30d', '90d', '1y'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`
                                px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                ${period === p
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}
                            `}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`$${data.revenue.totalRevenue.toLocaleString()}`}
                    subtext={`+$${data.revenue.projectedMonthly.toLocaleString()} projected`}
                    icon={DollarSign}
                    trend={12.5}
                    color="green"
                />
                <KPICard
                    title="Active Tenants"
                    value={data.engagement.activeTenants7d.toString()}
                    subtext="Active in last 7 days"
                    icon={Users}
                    trend={data.growth.tenantGrowthRate}
                    color="blue"
                />
                <KPICard
                    title="Total Sessions"
                    value={data.usage.totalSessions.toLocaleString()}
                    subtext="Across all tenants"
                    icon={Activity}
                    trend={8.2}
                    color="indigo"
                />
                <KPICard
                    title="Churn Rate"
                    value={`${data.growth.churnRate}%`}
                    subtext="This month"
                    icon={ArrowDown}
                    trend={-2.1}
                    color="orange"
                    inverseTrend
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Growth</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenue.revenueByPeriod}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number | undefined) => [`$${value}`, 'Revenue'] as [string, string]}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10B981"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Usage Trends */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Session Volume</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.usage.sessionsByDay}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Sessions" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Engagement"
                    metrics={[
                        { label: 'Avg Logins/Tenant', value: data.engagement.avgLoginsPerTenant.toFixed(1) },
                        { label: 'Peak Hour', value: `${data.usage.peakHour}:00` },
                        { label: 'Avg Sessions/Tenant', value: data.usage.avgSessionsPerTenant.toFixed(1) }
                    ]}
                />
                <MetricCard
                    title="Growth"
                    metrics={[
                        { label: 'New Tenants', value: data.growth.newTenantsThisMonth },
                        { label: 'New Clients', value: data.growth.newClientsThisMonth },
                        { label: 'Growth Rate', value: `${data.growth.tenantGrowthRate}%` }
                    ]}
                />
                <MetricCard
                    title="System Health"
                    metrics={[
                        { label: 'Uptime', value: '99.9%' },
                        { label: 'Error Rate', value: '0.05%' },
                        { label: 'Avg Response', value: '120ms' }
                    ]}
                />
            </div>
        </div>
    );
};

const KPICard = ({ title, value, subtext, icon: Icon, trend, color, inverseTrend }: any) => {
    const isPositive = trend > 0;
    const isGood = inverseTrend ? !isPositive : isPositive;

    const colorClasses = {
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        orange: 'bg-orange-50 text-orange-600',
    }[color as string] || 'bg-gray-50 text-gray-600';

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <Icon size={20} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xs text-gray-400 mt-2">{subtext}</p>
        </div>
    );
};

const MetricCard = ({ title, metrics }: { title: string, metrics: Array<{ label: string, value: string | number }> }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="space-y-4">
            {metrics.map((m, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-slate-700 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{m.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{m.value}</span>
                </div>
            ))}
        </div>
    </div>
);

export default OwnerAnalytics;
