import React, { useEffect, useState } from 'react';
import {
    CreditCard,
    Plus,
    X,
    Edit2,
    Save,
    Users,
    HardDrive,
    Activity
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { Plan, FeatureFlag } from '../../services/owner-portal.service';

const OwnerPlans: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [features, setFeatures] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [plansData, featuresData] = await Promise.all([
                ownerPortalService.getAllPlans(),
                ownerPortalService.getAllFeatures()
            ]);
            setPlans(plansData);
            setFeatures(featuresData);
        } catch (error) {
            console.error('Failed to load plans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (plan: Plan) => {
        setEditingPlan({ ...plan });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingPlan({
            name: '',
            key: '',
            price: 0,
            description: '',
            isActive: true,
            limits: {
                clients: 10,
                coaches: 1,
                sessions_per_month: 100,
                storage_gb: 1,
                locations: 1,
                custom_branding: false,
                white_label_email: false,
                api_access: false
            },
            features: []
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!editingPlan || !editingPlan.key || !editingPlan.name) return;

        try {
            if (editingPlan.id) {
                // Update
                await ownerPortalService.updatePlan(editingPlan.id, editingPlan);
            } else {
                // Create
                await ownerPortalService.createPlan(editingPlan);
            }
            setShowModal(false);
            setEditingPlan(null);
            loadData();
        } catch (error) {
            alert('Failed to save plan');
        }
    };

    const handleLimitChange = (key: string, value: any) => {
        if (!editingPlan) return;
        setEditingPlan({
            ...editingPlan,
            limits: {
                ...editingPlan.limits!,
                [key]: value
            }
        });
    };

    const toggleFeature = (featureKey: string) => {
        if (!editingPlan) return;
        const currentFeatures = editingPlan.features || [];
        const newFeatures = currentFeatures.includes(featureKey)
            ? currentFeatures.filter(k => k !== featureKey)
            : [...currentFeatures, featureKey];

        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading plans...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-blue-600" /> Subscription Plans
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage pricing tiers and limits</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                    <Plus size={18} /> New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className={`bg-white dark:bg-slate-800 rounded-xl border-2 shadow-sm relative overflow-hidden flex flex-col ${plan.isActive ? 'border-gray-100 dark:border-slate-700' : 'border-gray-200 dark:border-slate-700 opacity-75'}`}>
                        {!plan.isActive && (
                            <div className="absolute top-0 right-0 bg-gray-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold uppercase">
                                Inactive
                            </div>
                        )}
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono mb-2">{plan.key}</p>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 min-h-[40px]">{plan.description}</p>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usage Limits</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-blue-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {plan.limits.clients === -1 ? 'Unlimited' : plan.limits.clients} Clients
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-green-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {plan.limits.sessions_per_month === -1 ? 'Unlimited' : plan.limits.sessions_per_month} Sessions
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-indigo-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {plan.limits.coaches === -1 ? 'Unlimited' : plan.limits.coaches} Coaches
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HardDrive size={14} className="text-purple-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {plan.limits.storage_gb === -1 ? 'Unlimited' : `${plan.limits.storage_gb}GB`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                                {plan.features.length} features enabled
                            </span>
                            <button
                                onClick={() => handleEdit(plan)}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit/Create Modal */}
            {showModal && editingPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full p-6 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingPlan.id ? 'Edit Plan' : 'Create New Plan'}
                            </h3>
                            <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white border-b pb-2">Basic Info</h4>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Plan Name</label>
                                    <input
                                        type="text"
                                        value={editingPlan.name}
                                        onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Key (Unique ID)</label>
                                    <input
                                        type="text"
                                        value={editingPlan.key}
                                        onChange={e => setEditingPlan({ ...editingPlan, key: e.target.value })}
                                        disabled={!!editingPlan.id}
                                        className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700 disabled:opacity-50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Price ($)</label>
                                        <input
                                            type="number"
                                            value={editingPlan.price}
                                            onChange={e => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
                                        />
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingPlan.isActive}
                                                onChange={e => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Description</label>
                                    <textarea
                                        value={editingPlan.description}
                                        onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white border-b pb-2">Limits (-1 for unlimited)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'clients', label: 'Clients' },
                                        { key: 'coaches', label: 'Coaches' },
                                        { key: 'sessions_per_month', label: 'Sessions/Mo' },
                                        { key: 'locations', label: 'Locations' },
                                        { key: 'storage_gb', label: 'Storage (GB)' },
                                    ].map(limit => (
                                        <div key={limit.key}>
                                            <label className="block text-xs text-gray-500 mb-1">{limit.label}</label>
                                            <input
                                                type="number"
                                                value={editingPlan.limits?.[limit.key] as number ?? 0}
                                                onChange={e => handleLimitChange(limit.key, parseInt(e.target.value))}
                                                className="w-full border rounded-lg px-2 py-1.5 text-sm dark:bg-slate-900 dark:border-slate-700"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2 mt-4">
                                    {[
                                        { key: 'custom_branding', label: 'Custom Branding' },
                                        { key: 'white_label_email', label: 'White-label Email' },
                                        { key: 'api_access', label: 'API Access' },
                                    ].map(limit => (
                                        <label key={limit.key} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingPlan.limits?.[limit.key] as boolean ?? false}
                                                onChange={e => handleLimitChange(limit.key, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{limit.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-medium text-gray-900 dark:text-white border-b pb-2 mb-3">Included Features</h4>
                            <div className="h-40 overflow-y-auto grid grid-cols-2 gap-2 border rounded-lg p-2 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                                {features.map(feature => (
                                    <label key={feature.key} className="flex items-center gap-2 p-1 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingPlan.features?.includes(feature.key) ?? false}
                                            onChange={() => toggleFeature(feature.key)}
                                            className="w-3 h-3 text-blue-600 rounded"
                                        />
                                        <span className="text-xs">{feature.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Save size={18} /> Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerPlans;
