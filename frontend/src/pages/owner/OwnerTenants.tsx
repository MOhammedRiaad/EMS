import React, { useEffect, useState } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Users,
    CreditCard,
    Activity,
    Lock,
    Unlock,
    LogIn,
    RotateCw
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { TenantSummary } from '../../services/owner-portal.service';
import { Link } from 'react-router-dom';

const OwnerTenants: React.FC = () => {
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const { items, total } = await ownerPortalService.getTenants({
                search: search || undefined,
                status: filterStatus !== 'all' ? filterStatus : undefined,
                page,
                limit: 10
            });
            setTenants(items);
            setTotal(total);
        } catch (error) {
            console.error('Failed to load tenants', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            loadTenants();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search, filterStatus, page]);

    const handleImpersonate = async (tenantId: string) => {
        if (!confirm('Are you sure you want to log in as this tenant admin?')) return;
        try {
            const { token } = await ownerPortalService.impersonateTenant(tenantId);
            if (token) {
                // Save current owner state
                const currentToken = localStorage.getItem('token');
                const currentUser = localStorage.getItem('user');
                if (currentToken && currentUser) {
                    localStorage.setItem('ownerToken', currentToken);
                    localStorage.setItem('ownerUser', currentUser);
                }

                localStorage.setItem('token', token);
                window.location.href = '/';
            } else {
                alert('Failed to get access token');
            }
        } catch (error) {
            console.error('Impersonation failed', error);
            alert('Failed to impersonate tenant');
        }
    };

    const handleQuickRenew = async (tenantId: string, currentEndsAt?: string) => {
        if (!confirm('Extend subscription by 1 month?')) return;

        try {
            const now = new Date();
            const current = currentEndsAt ? new Date(currentEndsAt) : new Date();

            // If expired, start from now. If active, add to current end.
            let newEnd = new Date(current < now ? now : current);
            newEnd.setMonth(newEnd.getMonth() + 1);

            await ownerPortalService.updateTenantSubscription(tenantId, newEnd);
            loadTenants();
        } catch (error) {
            console.error('Renewal failed', error);
            alert('Failed to renew subscription');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                                <th className="px-6 py-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Tenant Name</th>
                                <th className="px-6 py-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Plan</th>
                                <th className="px-6 py-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Subscription</th>
                                <th className="px-6 py-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Status</th>
                                <th className="px-6 py-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Usage</th>
                                <th className="px-6 py-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Created</th>
                                <th className="px-6 py-4 font-semibold text-sm text-gray-600 dark:text-gray-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading && (tenants?.length || 0) === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading tenants...</td>
                                </tr>
                            ) : (tenants?.length || 0) === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No tenants found</td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <Link to={`/owner/tenants/${tenant.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                    {tenant.name}
                                                </Link>
                                                <div className="text-xs text-gray-500">{tenant.contactEmail}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                                <CreditCard size={12} />
                                                {tenant.plan?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.subscriptionEndsAt ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {new Date(tenant.subscriptionEndsAt).toLocaleDateString()}
                                                    </div>
                                                    {(() => {
                                                        const daysLeft = Math.ceil((new Date(tenant.subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        if (daysLeft < 0) return <span className="text-xs font-bold text-red-600">Expired</span>;
                                                        if (daysLeft <= 7) return <span className="text-xs font-bold text-orange-600">Expiring in {daysLeft} days</span>;
                                                        return null;
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">Auto-Renew</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`
                                                inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                                ${tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    tenant.status === 'trial' ? 'bg-purple-100 text-purple-700' :
                                                        tenant.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                                            `}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1" title="Clients">
                                                    <Users size={14} /> {tenant.stats?.clients || 0}
                                                </div>
                                                <div className="flex items-center gap-1" title="Sessions (Month)">
                                                    <Activity size={14} /> {tenant.stats?.sessionsThisMonth || 0}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(tenant.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleImpersonate(tenant.id)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Log in as Admin"
                                                >
                                                    <LogIn size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleQuickRenew(tenant.id, tenant.subscriptionEndsAt)}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Quick Renew (1 Month)"
                                                >
                                                    <RotateCw size={18} />
                                                </button>
                                                {tenant.status === 'suspended' ? (
                                                    <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Reactivate">
                                                        <Unlock size={18} />
                                                    </button>
                                                ) : (
                                                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Suspend">
                                                        <Lock size={18} />
                                                    </button>
                                                )}
                                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Showing {tenants?.length || 0} of {total} tenants
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-3 py-1 border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page * 10 >= total}
                            onClick={() => setPage(page + 1)}
                            className="px-3 py-1 border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerTenants;
