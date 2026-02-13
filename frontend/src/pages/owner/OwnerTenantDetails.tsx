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
    EyeOff,
    RotateCw,
    Calendar,
    AlertCircle
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
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [planDuration, setPlanDuration] = useState(1);
    const [renewalDuration, setRenewalDuration] = useState(1);

    // Manual date adjustment states
    const [useManualRenewalDate, setUseManualRenewalDate] = useState(false);
    const [manualRenewalDate, setManualRenewalDate] = useState('');
    const [useManualPlanDate, setUseManualPlanDate] = useState(false);
    const [manualPlanDate, setManualPlanDate] = useState('');

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

            // Initialize manual dates with current expiration if exists
            if (tenantData.tenant.subscriptionEndsAt) {
                const dateStr = new Date(tenantData.tenant.subscriptionEndsAt).toISOString().split('T')[0];
                setManualRenewalDate(dateStr);
                setManualPlanDate(dateStr);
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                setManualRenewalDate(dateStr);
                setManualPlanDate(dateStr);
            }
        } catch (error) {
            console.error('Failed to load tenant details', error);
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
            }
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
            let newEnd: Date;
            if (useManualPlanDate) {
                newEnd = new Date(manualPlanDate);
            } else {
                const now = new Date();
                const current = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : now;
                const base = current < now ? now : current;
                newEnd = new Date(base);
                newEnd.setMonth(newEnd.getMonth() + planDuration);
            }

            await ownerPortalService.updateTenantPlan(tenant.id, selectedPlan, newEnd);
            setShowPlanModal(false);
            loadTenant();
        } catch (error) {
            alert('Failed to update plan');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRenew = async () => {
        if (!tenant) return;
        setActionLoading(true);
        try {
            let newEnd: Date;
            if (useManualRenewalDate) {
                newEnd = new Date(manualRenewalDate);
            } else {
                const now = new Date();
                const current = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : now;
                const base = current < now ? now : current;
                newEnd = new Date(base);
                newEnd.setMonth(newEnd.getMonth() + renewalDuration);
            }

            await ownerPortalService.updateTenantSubscription(tenant.id, newEnd);
            setShowRenewModal(false);
            loadTenant();
        } catch (error) {
            alert('Failed to renew subscription');
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
            const newValue = !feature.isEnabled;
            await ownerPortalService.setFeatureForTenant(tenant.id, feature.key, newValue, "Manual override by owner");

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
    const subscriptionEndsAt = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : null;
    const isExpired = subscriptionEndsAt && subscriptionEndsAt < new Date();
    const isExpiringSoon = subscriptionEndsAt && !isExpired && (subscriptionEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 7;

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
                                <span className="font-medium text-gray-900 dark:text-white">{tenant.contactEmail}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Created</span>
                                <span className="font-medium text-gray-900 dark:text-white">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Status Panel */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="text-indigo-500" size={18} />
                                Subscription Status
                            </h3>
                            <button
                                onClick={() => setShowRenewModal(true)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Renew
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Ends At</div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                                        {subscriptionEndsAt ? subscriptionEndsAt.toLocaleDateString() : 'Never'}
                                    </span>
                                    {isExpired && (
                                        <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Expired</span>
                                    )}
                                    {isExpiringSoon && (
                                        <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Expiring Soon</span>
                                    )}
                                </div>
                            </div>

                            {isExpired && (
                                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p>Subscription has expired. Most features will be blocked until renewed.</p>
                                </div>
                            )}
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

            {/* Renew Modal */}
            {showRenewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <RotateCw size={22} className="text-indigo-600" />
                                Renew Subscription
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                Extend subscription duration for <b>{tenant.name}</b>.
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setUseManualRenewalDate(false)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!useManualRenewalDate ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Duration Presets
                                </button>
                                <button
                                    onClick={() => setUseManualRenewalDate(true)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${useManualRenewalDate ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Specific Date
                                </button>
                            </div>

                            {!useManualRenewalDate ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: '1 Month', value: 1 },
                                        { label: '3 Months', value: 3 },
                                        { label: '6 Months', value: 6 },
                                        { label: '1 Year', value: 12 },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setRenewalDuration(opt.value)}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${renewalDuration === opt.value
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <span className="font-bold text-lg">{opt.label}</span>
                                            <span className="text-[10px] uppercase tracking-wider opacity-60">Extension</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Calendar size={16} /> New Expiration Date
                                        </label>
                                        <input
                                            type="date"
                                            value={manualRenewalDate}
                                            onChange={(e) => setManualRenewalDate(e.target.value)}
                                            className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 rounded-lg text-xs border border-amber-100 dark:border-amber-800/50 flex gap-2">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <p>Setting a manual date will override any periodic calculation. Ensure this matches your billing records.</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs">
                                <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">New End Date:</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/60 px-3 py-1 rounded-full text-sm border dark:border-indigo-800/50">
                                    {useManualRenewalDate
                                        ? new Date(manualRenewalDate).toLocaleDateString()
                                        : (() => {
                                            const now = new Date();
                                            const current = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : now;
                                            const base = current < now ? now : current;
                                            const d = new Date(base);
                                            d.setMonth(d.getMonth() + renewalDuration);
                                            return d.toLocaleDateString();
                                        })()
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-slate-800/80 flex justify-end gap-3">
                            <button
                                onClick={() => setShowRenewModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRenew}
                                disabled={actionLoading}
                                className="px-8 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                            >
                                {actionLoading ? 'Renewing...' : 'Confirm Renewal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Modal */}
            {showSuspendModal && (
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
                            className="w-full border p-4 rounded-lg mb-4 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                            rows={3}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspend}
                                disabled={!suspendReason || actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold"
                            >
                                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[95vh] border border-gray-100 dark:border-slate-700">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Subscription Plan</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upgrade or downgrade <b>{tenant.name}</b></p>
                        </div>

                        <div className="p-6 space-y-8">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select New Plan</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {['starter', 'pro', 'enterprise', 'trial'].map(plan => (
                                        <button
                                            key={plan}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${selectedPlan === plan
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`text-[10px] font-bold uppercase mb-1 ${selectedPlan === plan ? 'text-blue-600' : 'text-gray-400'}`}>{plan}</div>
                                            <div className="font-bold text-gray-900 dark:text-white capitalize">{plan} Plan</div>
                                            {selectedPlan === plan && <Zap size={14} className="absolute top-2 right-2 text-blue-500 fill-blue-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Set Expiration Term</h4>
                                <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl mb-4">
                                    <button
                                        onClick={() => setUseManualPlanDate(false)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!useManualPlanDate ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        Presets
                                    </button>
                                    <button
                                        onClick={() => setUseManualPlanDate(true)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${useManualPlanDate ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        Custom
                                    </button>
                                </div>

                                {!useManualPlanDate ? (
                                    <div className="flex gap-2">
                                        {[
                                            { label: '1 Mo', value: 1 },
                                            { label: '3 Mo', value: 3 },
                                            { label: '6 Mo', value: 6 },
                                            { label: '1 Yr', value: 12 },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setPlanDuration(opt.value)}
                                                className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${planDuration === opt.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                                                    : 'border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="date"
                                        value={manualPlanDate}
                                        onChange={(e) => setManualPlanDate(e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                    />
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-bold uppercase">Final Expiration:</span>
                                <span className="text-blue-600 font-bold">
                                    {useManualPlanDate
                                        ? new Date(manualPlanDate).toLocaleDateString()
                                        : (() => {
                                            const now = new Date();
                                            const current = tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : now;
                                            const base = current < now ? now : current;
                                            const d = new Date(base);
                                            d.setMonth(d.getMonth() + planDuration);
                                            return d.toLocaleDateString();
                                        })()
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-slate-800/80 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowPlanModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePlan}
                                disabled={actionLoading}
                                className="px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                            >
                                {actionLoading ? 'Updating...' : 'Update Plan & Term'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerTenantDetails;
