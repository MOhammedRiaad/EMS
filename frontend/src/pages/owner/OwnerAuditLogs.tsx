import React, { useEffect, useState } from 'react';
import {
    History,
    RefreshCw,
    User,
    Building
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { OwnerAuditLog, TenantSummary } from '../../services/owner-portal.service';

const OwnerAuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<OwnerAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        action: '',
        ownerId: '',
        targetTenantId: '',
        limit: 50,
        offset: 0
    });

    // Auxiliary data for filters
    const [tenants, setTenants] = useState<TenantSummary[]>([]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const result = await ownerPortalService.getAuditLogs(filters);
            setLogs(result.logs || []);
            setTotal(result.total || 0);
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTenants = async () => {
        try {
            const result = await ownerPortalService.getAllTenants({ limit: 100 });
            setTenants(result.items);
        } catch (error) {
            console.error('Failed to load tenants for filter', error);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
    };

    const actionColors: Record<string, string> = {
        'SUSPEND_TENANT': 'text-red-600 bg-red-100',
        'REACTIVATE_TENANT': 'text-green-600 bg-green-100',
        'UPDATE_PLAN': 'text-blue-600 bg-blue-100',
        'ENABLE_FEATURE': 'text-purple-600 bg-purple-100',
        'DISABLE_FEATURE': 'text-gray-600 bg-gray-100',
        'APPROVE_UPGRADE': 'text-green-600 bg-green-100',
        'REJECT_UPGRADE': 'text-red-600 bg-red-100',
        'UPDATE_ROLE': 'text-orange-600 bg-orange-100',
        'CREATE_ROLE': 'text-green-600 bg-green-100',
        'BROADCAST_MESSAGE': 'text-indigo-600 bg-indigo-100',
        'UPDATE_SYSTEM_SETTING': 'text-teal-600 bg-teal-100',
    };

    const getActionBadge = (action: string) => {
        const style = actionColors[action] || 'text-gray-600 bg-gray-100';
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${style}`}>
                {action.replace(/_/g, ' ')}
            </span>
        );
    };

    const formatDetails = (details: any) => {
        if (!details) return '-';
        return (
            <pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap max-w-xs">
                {JSON.stringify(details, null, 2)}
            </pre>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History className="text-blue-600" /> Audit Logs
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Track all administrative actions across the platform</p>
                </div>
                <button
                    onClick={loadLogs}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Action Type</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-gray-300"
                        value={filters.action}
                        onChange={e => handleFilterChange('action', e.target.value)}
                    >
                        <option value="">All Actions</option>
                        <option value="SUSPEND_TENANT">Suspend Tenant</option>
                        <option value="REACTIVATE_TENANT">Reactivate Tenant</option>
                        <option value="UPDATE_PLAN">Update Plan</option>
                        <option value="APPROVE_UPGRADE">Approve Upgrade</option>
                        <option value="REJECT_UPGRADE">Reject Upgrade</option>
                        <option value="UPDATE_ROLE">Update Role</option>
                        <option value="ENABLE_FEATURE">Enable Feature</option>
                        <option value="BROADCAST_MESSAGE">Broadcast Message</option>
                        <option value="UPDATE_SYSTEM_SETTING">Update System Setting</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Target Tenant</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-gray-300"
                        value={filters.targetTenantId}
                        onChange={e => handleFilterChange('targetTenantId', e.target.value)}
                    >
                        <option value="">All Tenants</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Owner ID</label>
                    <input
                        type="text"
                        placeholder="Filter by Admin ID..."
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-gray-300"
                        value={filters.ownerId}
                        onChange={e => handleFilterChange('ownerId', e.target.value)}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">Action</th>
                                <th className="px-6 py-4 font-medium">Admin</th>
                                <th className="px-6 py-4 font-medium">Target</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading audit logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No audit logs found matching your filters.</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                <span className="font-mono text-xs">{log.ownerId.substring(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {log.targetTenantId ? (
                                                <div className="flex items-center gap-2">
                                                    <Building size={14} className="text-gray-400" />
                                                    <span>{tenants.find(t => t.id === log.targetTenantId)?.name || 'Unknown Tenant'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatDetails(log.details)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                                            {log.ipAddress || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Showing {logs.length} of {total} logs
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={filters.offset === 0}
                            onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={logs.length < filters.limit}
                            onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerAuditLogs;
