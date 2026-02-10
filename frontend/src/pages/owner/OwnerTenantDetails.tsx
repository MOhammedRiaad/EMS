import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CreditCard,
    Activity,
    Users,
    Lock,
    Unlock,
    LogIn,
    Database,
    Mail,
    Zap,
    RotateCcw,
    Download,

    Trash2,
    EyeOff
} from 'lucide-react';
import type { TenantFeatureState } from '../../services/owner-portal.service';
import { ownerPortalService } from '../../services/owner-portal.service';

const OwnerTenantDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<any | null>(null);
    const [features, setFeatures] = useState<TenantFeatureState[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [featureLoading, setFeatureLoading] = useState<string | null>(null);

    // Action states
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');

    const loadTenant = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const tenantData = await ownerPortalService.getTenantDetails(id);
            setTenant(tenantData.tenant);

            // Map backend features structure to frontend TenantFeatureState
            if (tenantData.tenant.features && Array.isArray(tenantData.tenant.features)) {
                const mappedFeatures: TenantFeatureState[] = tenantData.tenant.features.map((item: any) => ({
                    key: item.feature.key,
                    name: item.feature.name,
                    description: item.feature.description,
                    category: item.feature.category,
                    isEnabled: item.enabled,
                    isOverridden: item.source === 'override',
                    overrideValue: item.source === 'override' ? item.enabled : undefined,
                    dependencies: item.feature.dependencies
                }));
                setFeatures(mappedFeatures);
            }

            setSelectedPlan(tenantData.tenant.plan?.key || 'starter');
        } catch (error) {
            console.error('Failed to load tenant details', error);
            // navigate('/owner/tenants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenant();
    }, [id]);

    const handleImpersonate = async () => {
        if (!tenant || !confirm(`Log in as admin for ${tenant.name}?`)) return;
        try {
            const { token } = await ownerPortalService.impersonateTenant(tenant.id);
            localStorage.setItem('token', token);
            window.location.href = '/';
        } catch (error) {
            alert('Failed to impersonate tenant');
        }
    };

    const handleSuspend = async () => {
        if (!tenant || !suspendReason) return;
        setActionLoading(true);
        try {
            await ownerPortalService.suspendTenant(tenant.id, suspendReason);
            setShowSuspendModal(false);
            setSuspendReason('');
            loadTenant();
        } catch (error) {
            alert('Failed to suspend tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivate = async () => {
        if (!tenant || !confirm('Reactivate this tenant?')) return;
        setActionLoading(true);
        try {
            await ownerPortalService.reactivateTenant(tenant.id);
            loadTenant();
        } catch (error) {
            alert('Failed to reactivate tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdatePlan = async () => {
        if (!tenant || !selectedPlan) return;
        setActionLoading(true);
        try {
            await ownerPortalService.updateTenantPlan(tenant.id, selectedPlan);
            setShowPlanModal(false);
            loadTenant();
        } catch (error) {
            alert('Failed to update plan');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = async () => {
        if (!tenant) return;
        try {
            const data = await ownerPortalService.exportTenantData(tenant.id);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tenant-export-${tenant.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to export tenant data');
        }
    };

    const handleDelete = async () => {
        if (!tenant || !confirm(`ARE YOU SURE? This will PERMANENTLY DELETE tenant "${tenant.name}" and ALL associated data (users, clients, sessions, financials). This action CANNOT be undone.`)) return;

        // Double confirm for safety
        const verification = prompt(`To confirm deletion, type "${tenant.name}" below:`);
        if (verification !== tenant.name) {
            alert('Verification failed. Deletion cancelled.');
            return;
        }

        setActionLoading(true);
        try {
            await ownerPortalService.deleteTenant(tenant.id);
            alert('Tenant deleted successfully.');
            navigate('/owner/tenants');
        } catch (error) {
            console.error('Failed to delete tenant:', error);
            alert('Failed to delete tenant. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAnonymize = async () => {
        if (!tenant || !confirm(`ANONYMIZE ALL DATA? This will replace all user/client names and emails with dummy data for tenant "${tenant.name}". This preserves logs/stats but removes PII. This action CANNOT be undone.`)) return;

        setActionLoading(true);
        try {
            await ownerPortalService.anonymizeTenant(tenant.id);
            alert('Tenant data anonymized successfully.');
            loadTenant();
        } catch (error) {
            console.error('Failed to anonymize tenant:', error);
            alert('Failed to anonymize tenant.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFeatureToggle = async (feature: TenantFeatureState) => {
        if (!tenant) return;
        setFeatureLoading(feature.key);
        try {
            // If already overridden, we are toggling the override value
            // If not overridden, we are creating an override with the opposite of current enabled state
            const newValue = !feature.isEnabled;
            await ownerPortalService.setFeatureForTenant(tenant.id, feature.key, newValue, "Manual override by owner");

            // Refresh features
            const rawFeatures = await ownerPortalService.getFeaturesForTenant(tenant.id);
            const mappedFeatures = rawFeatures.map((item: any) => ({
                key: item.feature.key,
                name: item.feature.name,
                description: item.feature.description,
                category: item.feature.category,
                isEnabled: item.enabled,
                isOverridden: item.source === 'override',
                overrideValue: item.source === 'override' ? item.enabled : undefined,
                dependencies: item.feature.dependencies
            }));
            setFeatures(mappedFeatures);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to update feature';
            alert(message);
        } finally {
            setFeatureLoading(null);
        }
    };

    const handleFeatureReset = async (featureKey: string) => {
        if (!tenant) return;
        setFeatureLoading(featureKey);
        try {
            await ownerPortalService.removeFeatureOverride(tenant.id, featureKey);
            // Refresh features
            const rawFeatures = await ownerPortalService.getFeaturesForTenant(tenant.id);
            const mappedFeatures = rawFeatures.map((item: any) => ({
                key: item.feature.key,
                name: item.feature.name,
                description: item.feature.description,
                category: item.feature.category,
                isEnabled: item.enabled,
                isOverridden: item.source === 'override',
                overrideValue: item.source === 'override' ? item.enabled : undefined,
                dependencies: item.feature.dependencies
            }));
            setFeatures(mappedFeatures);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to reset feature';
            alert(message);
        } finally {
            setFeatureLoading(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading tenant details...</div>;
    if (!tenant) return <div className="p-8 text-center text-red-500">Tenant not found</div>;

    const usage = tenant.usage || {};

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/owner/tenants')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        {tenant.name}
                        <span className={`
                            px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                            ${tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                                tenant.status === 'trial' ? 'bg-purple-100 text-purple-700' :
                                    tenant.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                        `}>
                            {tenant.status}
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">ID: {tenant.id}</p>
                </div>
                <div className="ml-auto flex gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 border border-gray-200 text-gray-700 dark:text-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 font-medium"
                    >
                        <Download size={16} /> Export Data
                    </button>
                    <button
                        onClick={handleImpersonate}
                        className="px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 font-medium"
                    >
                        <LogIn size={16} /> Log In as Admin
                    </button>
                    {tenant.status === 'suspended' ? (
                        <button
                            onClick={handleReactivate}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2 font-medium shadow-sm"
                        >
                            <Unlock size={16} /> Reactivate Tenant
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowSuspendModal(true)}
                            className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium shadow-sm"
                        >
                            <Lock size={16} /> Suspend Tenant
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Plan & Details */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="text-blue-500" size={18} />
                                Subscription Plan
                            </h3>
                            <button
                                onClick={() => setShowPlanModal(true)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Change Plan
                            </button>
                        </div>

                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            {tenant.plan?.name}
                        </div>
                        <div className="text-sm text-gray-500 mb-6">
                            ${tenant.plan?.price}/month
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Contact</span>
                                <span className="font-medium">{tenant.contactEmail}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Created</span>
                                <span className="font-medium">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Usage Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Activity className="text-indigo-500" size={18} />
                            Current Usage
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Clients */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Users size={14} /> Clients
                                    </span>
                                    <span className="text-xs text-gray-500">{usage.clients?.current || 0} / {usage.clients?.limit === -1 ? '∞' : usage.clients?.limit}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(usage.clients?.percentage || 0, 100)}%` }}></div>
                                </div>
                            </div>

                            {/* Sessions */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Activity size={14} /> Sessions (Mo)
                                    </span>
                                    <span className="text-xs text-gray-500">{usage.sessionsThisMonth?.current || 0} / {usage.sessionsThisMonth?.limit === -1 ? '∞' : usage.sessionsThisMonth?.limit}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(usage.sessionsThisMonth?.percentage || 0, 100)}%` }}></div>
                                </div>
                            </div>

                            {/* Storage */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Database size={14} /> Storage (GB)
                                    </span>
                                    <span className="text-xs text-gray-500">{usage.storageGB?.current.toFixed(2) || 0} / {usage.storageGB?.limit === -1 ? '∞' : usage.storageGB?.limit}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(usage.storageGB?.percentage || 0, 100)}%` }}></div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Mail size={14} /> Emails (Mo)
                                    </span>
                                    <span className="text-xs text-gray-500">{usage.emailThisMonth?.current || 0} / {usage.emailThisMonth?.limit === -1 ? '∞' : usage.emailThisMonth?.limit}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(usage.emailThisMonth?.percentage || 0, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Flags */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-yellow-500" size={18} />
                                Feature Configuration
                            </h3>
                            <button
                                onClick={() => navigate('/owner/features')}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Manage Global Flags
                            </button>
                        </div>

                        <div className="space-y-4">
                            {features.length === 0 ? (
                                <p className="text-gray-500 text-sm">No feature flags available.</p>
                            ) : (
                                features.map(feature => (
                                    <div key={feature.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white text-sm">{feature.name}</span>
                                                {feature.isOverridden && (
                                                    <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">Override</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{feature.key}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {feature.isOverridden && (
                                                <button
                                                    onClick={() => handleFeatureReset(feature.key)}
                                                    disabled={featureLoading === feature.key}
                                                    title="Reset to default"
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleFeatureToggle(feature)}
                                                disabled={featureLoading === feature.key}
                                                className={`
                                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                                    ${feature.isEnabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-600'}
                                                    ${featureLoading === feature.key ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                <span
                                                    className={`
                                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                                        ${feature.isEnabled ? 'translate-x-6' : 'translate-x-1'}
                                                    `}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>


                    {/* Dangerous Zone */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                        <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                            <Trash2 size={18} />
                            Danger Zone
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Permanently delete this tenant and all associated data. This action cannot be undone.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={handleAnonymize}
                                disabled={actionLoading}
                                className="w-full px-4 py-2 border border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                <EyeOff size={16} /> Anonymize (Soft Delete)
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="w-full px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                <Trash2 size={16} /> Delete Tenant
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Suspend Modal */}
            {
                showSuspendModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Suspend Tenant Access</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                This will immediately block access for all users in this tenant.
                            </p>
                            <textarea
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                placeholder="Reason for suspension (required)"
                                className="w-full border p-2 rounded-lg mb-4 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                                rows={3}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSuspendModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSuspend}
                                    disabled={!suspendReason || actionLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Plan Modal */}
            {
                showPlanModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Subscription Plan</h3>
                            <div className="space-y-3 mb-6">
                                {['trial', 'starter', 'pro', 'enterprise'].map(plan => (
                                    <label key={plan} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white dark:border-slate-700">
                                        <input
                                            type="radio"
                                            name="plan"
                                            value={plan}
                                            checked={selectedPlan === plan}
                                            onChange={(e) => setSelectedPlan(e.target.value)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="capitalize font-medium">{plan}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPlanModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePlan}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Updating...' : 'Update Plan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OwnerTenantDetails;
