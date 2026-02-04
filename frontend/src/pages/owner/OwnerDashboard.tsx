import React, { useEffect, useState } from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    Activity,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { GlobalAnalytics, Alert } from '../../services/owner-portal.service';

const OwnerDashboard: React.FC = () => {
    const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [analyticsData, alertsData] = await Promise.all([
                    ownerPortalService.getAnalytics('30d'),
                    ownerPortalService.getAlerts({ limit: 5, acknowledged: false })
                ]);
                setAnalytics(analyticsData);
                setAlerts(alertsData);
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            +12%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(analytics?.revenue.totalRevenue || 0)}
                    </h3>
                    <p className="text-sm text-gray-500">Total Revenue (30d)</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            +{analytics?.growth.newTenantsThisMonth || 0}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics?.engagement.activeTenants7d || 0}
                    </h3>
                    <p className="text-sm text-gray-500">Active Tenants (7d)</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Avg
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics?.usage.avgSessionsPerTenant?.toFixed(0) || 0}
                    </h3>
                    <p className="text-sm text-gray-500">Sessions / Tenant</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                            <Activity size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Peak
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics?.usage.peakHour !== undefined ? `${analytics.usage.peakHour}:00` : '--:--'}
                    </h3>
                    <p className="text-sm text-gray-500">Peak Usage Hour</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Alerts */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="text-yellow-500" size={18} />
                            System Alerts
                        </h3>
                        <Link to="/owner/alerts" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No active alerts</div>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} className="p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className={`
                                        w-2 h-2 mt-2 rounded-full shrink-0
                                        ${alert.severity === 'critical' ? 'bg-red-500' :
                                            alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}
                                    `}></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {alert.title}
                                            </h4>
                                            <span className="text-xs text-gray-400">
                                                {new Date(alert.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {alert.message}
                                        </p>
                                        {alert.tenantName && (
                                            <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded mt-2 inline-block">
                                                {alert.tenantName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => ownerPortalService.triggerSystemCheck()}
                            className="w-full py-2 px-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-3"
                        >
                            <Activity size={16} /> Run System Health Check
                        </button>
                        <Link
                            to="/owner/features"
                            className="w-full py-2 px-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-3"
                        >
                            <TrendingUp size={16} /> Manage Feature Flags
                        </Link>
                        <Link
                            to="/owner/plans"
                            className="w-full py-2 px-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-3"
                        >
                            <DollarSign size={16} /> Review Pricing Plans
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
