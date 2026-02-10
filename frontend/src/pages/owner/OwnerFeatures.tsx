import React, { useEffect, useState } from 'react';
import {
    Zap,
    Search,
    Plus,
    AlertTriangle,
    X,
    Layout,
    Users,
    DollarSign,
    MessageSquare,
    Shield
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { FeatureFlag } from '../../services/owner-portal.service';

const OwnerFeatures: React.FC = () => {
    const [features, setFeatures] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [processingKey, setProcessingKey] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create form state
    const [newFeature, setNewFeature] = useState({
        key: '',
        name: '',
        description: '',
        category: 'core',
        defaultEnabled: false,
        isExperimental: false
    });

    const loadFeatures = async () => {
        setLoading(true);
        try {
            const data = await ownerPortalService.getAllFeatures();
            setFeatures(data);
        } catch (error) {
            console.error('Failed to load features', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeatures();
    }, []);

    const handleToggle = async (key: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this feature globally? This will affect all tenants unless overridden.`)) return;

        setProcessingKey(key);
        try {
            await ownerPortalService.toggleFeatureGlobally(key, !currentStatus);
            setFeatures(prev => prev.map(f => f.key === key ? { ...f, isEnabled: !currentStatus } : f));
        } catch (error) {
            alert('Failed to toggle feature');
        } finally {
            setProcessingKey(null);
        }
    };

    const handleCreate = async () => {
        if (!newFeature.key || !newFeature.name) return;

        try {
            await ownerPortalService.createFeatureFlag(newFeature);
            setShowCreateModal(false);
            setNewFeature({
                key: '',
                name: '',
                description: '',
                category: 'core',
                defaultEnabled: false,
                isExperimental: false
            });
            loadFeatures();
        } catch (error) {
            alert('Failed to create feature');
        }
    };

    const categories = Array.from(new Set(features.map(f => f.category)));

    const filteredFeatures = features.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.key.toLowerCase().includes(search.toLowerCase()) ||
            f.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'core': return <Layout size={16} />;
            case 'client': return <Users size={16} />;
            case 'coach': return <Users size={16} />;
            case 'finance': return <DollarSign size={16} />;
            case 'marketing': return <MessageSquare size={16} />;
            case 'communication': return <MessageSquare size={16} />;
            case 'compliance': return <Shield size={16} />;
            default: return <Zap size={16} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="text-yellow-500" /> Feature Flags
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage global feature availability and rollouts</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                    <Plus size={18} /> New Feature
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search features..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'}`}
                    >
                        All Categories
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors flex items-center gap-2 ${categoryFilter === cat ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'}`}
                        >
                            {getCategoryIcon(cat)} {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading features...</div>
                ) : filteredFeatures.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                        <p className="text-gray-500">No features found matching your filters.</p>
                    </div>
                ) : (
                    filteredFeatures.map(feature => (
                        <div key={feature.key} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{feature.name}</h3>
                                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-slate-700 text-gray-500">
                                        {feature.key}
                                    </span>
                                    {feature.isExperimental && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                                            <AlertTriangle size={10} /> Experimental
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{feature.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1 capitalize">
                                        {getCategoryIcon(feature.category)} {feature.category}
                                    </span>
                                    {feature.dependencies && feature.dependencies.length > 0 && (
                                        <span>Depends on: {feature.dependencies.join(', ')}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                                <div className="flex-1 md:text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Global Status</div>
                                    <div className={`text-xs ${feature.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                        {feature.isEnabled ? 'Enabled Globally' : 'Disabled Globally'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggle(feature.key, feature.isEnabled)}
                                    disabled={processingKey === feature.key}
                                    className={`
                                        relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                        ${feature.isEnabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                                            ${feature.isEnabled ? 'translate-x-7' : 'translate-x-1'}
                                        `}
                                    />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Feature Flag</h3>
                            <button onClick={() => setShowCreateModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feature Key (e.g., core.calendar)</label>
                                <input
                                    type="text"
                                    value={newFeature.key}
                                    onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value })}
                                    placeholder="category.feature_name"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={newFeature.name}
                                    onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                                    placeholder="Calendar Integration"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={newFeature.description}
                                    onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select
                                        value={newFeature.category}
                                        onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="core">Core</option>
                                        <option value="client">Client</option>
                                        <option value="coach">Coach</option>
                                        <option value="finance">Finance</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="communication">Communication</option>
                                        <option value="compliance">Compliance</option>
                                        <option value="dashboard">Dashboard</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="experimental"
                                        checked={newFeature.isExperimental}
                                        onChange={(e) => setNewFeature({ ...newFeature, isExperimental: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="experimental" className="text-sm font-medium text-gray-700 dark:text-gray-300">Is Experimental</label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newFeature.key || !newFeature.name}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Create Feature
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerFeatures;
