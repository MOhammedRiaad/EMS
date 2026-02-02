import React, { useState, useEffect } from 'react';
import { Package, Calendar, Clock, Loader2, Gift } from 'lucide-react';
import { authenticatedFetch } from '../../services/api';

interface PackageItem {
    id: string;
    name: string;
    type: 'sessions' | 'subscription';
    purchaseDate: string;
    expiryDate?: string;
    totalSessions?: number;
    usedSessions?: number;
    remainingSessions?: number;
    status: 'active' | 'expired' | 'cancelled';
    price: number;
}

const ClientPackages: React.FC = () => {
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            setLoading(true);
            const data = await authenticatedFetch('/client-portal/packages');
            setPackages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load packages:', err);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredPackages = packages.filter(pkg => {
        if (filter === 'all') return true;
        if (filter === 'active') return pkg.status === 'active';
        return pkg.status === 'expired' || pkg.status === 'cancelled';
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Active</span>;
            case 'expired':
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Expired</span>;
            default:
                return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Cancelled</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto pb-20 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="text-blue-600" size={24} />
                    My Packages
                </h1>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'active', label: 'Active' },
                    { id: 'expired', label: 'History' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${filter === tab.id
                            ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Summary Card (Active Packages) */}
            {filter !== 'expired' && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-blue-100 text-sm">Available Sessions</span>
                        <Gift className="text-blue-200" size={20} />
                    </div>
                    <div className="text-4xl font-bold">
                        {packages.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.remainingSessions || 0), 0)}
                    </div>
                    <p className="text-blue-100 text-sm mt-1">from {packages.filter(p => p.status === 'active').length} active package(s)</p>
                </div>
            )}

            {/* Packages List */}
            {filteredPackages.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {filter === 'active' ? 'No active packages' : filter === 'expired' ? 'No package history' : 'No packages found'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPackages.map(pkg => (
                        <div key={pkg.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Calendar size={12} />
                                        Purchased {new Date(pkg.purchaseDate).toLocaleDateString()}
                                    </p>
                                </div>
                                {getStatusBadge(pkg.status)}
                            </div>

                            {pkg.type === 'sessions' && (
                                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Sessions Used</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {pkg.usedSessions} / {pkg.totalSessions}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${((pkg.usedSessions || 0) / (pkg.totalSessions || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                                        {pkg.remainingSessions} sessions remaining
                                    </p>
                                </div>
                            )}

                            {pkg.expiryDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
                                    <Clock size={12} />
                                    {pkg.status === 'active' ? 'Expires' : 'Expired'} {new Date(pkg.expiryDate).toLocaleDateString()}
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                                <span className="text-xs text-gray-500">Price</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${pkg.price?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientPackages;
