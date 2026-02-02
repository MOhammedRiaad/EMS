import React, { useState, useEffect } from 'react';
import { Package, Clock, Loader2, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../../services/api';

// Reusing the ProgressRing from ClientHomeComponents (or redeclaring it if not exported)
// Ideally we should move it to a shared component, but for now I'll inline a simple version or just use the radial design.

const ProgressRing: React.FC<{
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}> = ({ progress, size = 120, strokeWidth = 8, color = '#667eea' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="progress-ring transform -rotate-90">
            <circle
                stroke="currentColor"
                className="text-gray-100 dark:text-slate-700"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <circle
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
        </svg>
    );
};

interface PackageItem {
    id: string;
    package: {
        id: string;
        name: string;
        description?: string;
        price: number;
    };
    purchaseDate: string;
    expiryDate?: string;
    sessionsUsed: number;
    sessionsRemaining: number;
    status: 'active' | 'expired' | 'depleted' | 'cancelled';
    price?: number;
}

const ClientPackages: React.FC = () => {
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

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
        return pkg.status !== 'active';
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'depleted':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'expired':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    // Calculate total available sessions
    const totalAvailable = packages
        .filter(p => p.status === 'active')
        .reduce((sum, p) => sum + (p.sessionsRemaining || 0), 0);

    return (
        <div className="max-w-xl mx-auto pb-24 px-4 space-y-6">
            <header className="pt-6 pb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-xl text-purple-600">
                        <Package size={24} />
                    </div>
                    My Packages
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">
                    Manage your session credits and history
                </p>
            </header>

            {/* Stats Overview */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-purple-100 text-sm font-medium mb-1">Total Available Sessions</p>
                        <h2 className="text-4xl font-bold">{totalAvailable}</h2>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <Gift size={32} className="text-white" />
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Filters */}
            <div className="flex bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-xl">
                {[
                    { id: 'active', label: 'Active' },
                    { id: 'inactive', label: 'History' },
                    { id: 'all', label: 'All' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${filter === tab.id
                            ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Packages List */}
            <div className="space-y-4">
                {filteredPackages.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                        <Package className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {filter === 'active' ? 'No active packages' : 'No packages found'}
                        </p>
                    </div>
                ) : (
                    filteredPackages.map((pkg, index) => {
                        const totalSessions = (pkg.sessionsUsed || 0) + (pkg.sessionsRemaining || 0);
                        const progress = totalSessions > 0 ? (pkg.sessionsRemaining / totalSessions) * 100 : 0;
                        const isExpiringSoon = pkg.status === 'active' && pkg.expiryDate &&
                            (new Date(pkg.expiryDate).getTime() - Date.now()) < (7 * 24 * 60 * 60 * 1000);

                        return (
                            <div
                                key={pkg.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden group"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(pkg.status)}`}>
                                                {pkg.status}
                                            </span>
                                            {isExpiringSoon && (
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                                                    Expiring Soon
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1">
                                            {pkg.package?.name || 'Untitled Package'}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            Purchased {new Date(pkg.purchaseDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Radial Progress for Sessions */}
                                    <div className="relative">
                                        <ProgressRing
                                            progress={progress}
                                            size={64}
                                            strokeWidth={5}
                                            color={pkg.status === 'active' ? '#8b5cf6' : '#94a3b8'}
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-base font-bold ${pkg.status === 'active' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                                                {pkg.sessionsRemaining}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-100 dark:border-slate-800">
                                    <div>
                                        <span className="text-xs text-gray-400 block mb-0.5">Used</span>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {pkg.sessionsUsed} <span className="text-gray-400 font-normal">/ {totalSessions}</span>
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block mb-0.5">Expires</span>
                                        <span className={`text-sm font-semibold flex items-center justify-end gap-1 ${isExpiringSoon ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString() : 'Never'}
                                            {pkg.expiryDate && <Clock size={12} />}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2 text-right">
                                    <span className="text-xs font-medium text-gray-300 dark:text-slate-600">
                                        ID: {pkg.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="text-center pt-4">
                <Link to="/client/home" className="inline-flex items-center text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default ClientPackages;
