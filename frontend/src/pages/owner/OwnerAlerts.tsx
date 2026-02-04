import React, { useEffect, useState } from 'react';
import {
    Bell,
    Check,
    AlertTriangle,
    Info,
    Shield,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { Alert } from '../../services/owner-portal.service';

const OwnerAlerts: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all');

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const data = await ownerPortalService.getAlerts({
                acknowledged: filter === 'unacknowledged' ? false : undefined
            });
            setAlerts(data);
        } catch (error) {
            console.error('Failed to load alerts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, [filter]);

    const handleAcknowledge = async (id: string) => {
        try {
            await ownerPortalService.acknowledgeAlert(id);
            // Optimistic update
            setAlerts(prev => prev.map(a =>
                a.id === id ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a
            ));
        } catch (error) {
            console.error('Failed to acknowledge alert', error);
        }
    };

    const handleAcknowledgeAll = async () => {
        if (!confirm('Acknowledge all visible alerts?')) return;
        try {
            await ownerPortalService.acknowledgeAllAlerts();
            loadAlerts();
        } catch (error) {
            console.error('Failed to acknowledge all', error);
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <XCircle className="text-red-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30';
            case 'warning': return 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30';
            default: return 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="text-blue-600" /> System Alerts
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Monitor system health and tenant issues</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as 'all' | 'unacknowledged')}
                        className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Alerts</option>
                        <option value="unacknowledged">Unacknowledged Only</option>
                    </select>
                    <button
                        onClick={handleAcknowledgeAll}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                        <CheckCircle size={18} /> Clear All
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading alerts...</div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                        <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Systems Operational</h3>
                        <p className="text-gray-500">No active alerts found.</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-xl border flex gap-4 transition-all ${getSeverityClass(alert.severity)} ${alert.acknowledged ? 'opacity-60' : ''}`}
                        >
                            <div className="flex-shrink-0 pt-1">
                                {getSeverityIcon(alert.severity)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        {alert.title}
                                        {alert.acknowledged && (
                                            <span className="text-xs font-normal px-2 py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1">
                                                <Check size={10} /> Acknowledged
                                            </span>
                                        )}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        {new Date(alert.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{alert.message}</p>
                                {alert.tenantName && (
                                    <div className="mt-2 text-xs font-medium text-gray-500 flex items-center gap-1">
                                        <Shield size={12} /> Tenant: {alert.tenantName}
                                    </div>
                                )}
                            </div>
                            {!alert.acknowledged && (
                                <div className="flex flex-col justify-center">
                                    <button
                                        onClick={() => handleAcknowledge(alert.id)}
                                        className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Acknowledge"
                                    >
                                        <Check size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OwnerAlerts;
