import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Users, TrendingUp, AlertTriangle, Send } from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import BroadcastComposer from './components/BroadcastComposer';
import BroadcastHistory from './components/BroadcastHistory';

interface MessagingStats {
    totalClients: number;
    totalCoaches: number;
    totalSessionsThisMonth: number;
    totalSmsThisMonth: number;
    totalEmailThisMonth: number;
}

const OwnerMessaging = () => {
    const [stats, setStats] = useState<MessagingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'broadcasts'>('overview');
    const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await ownerPortalService.getMessagingStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch messaging stats:', err);
            setError('Could not load messaging statistics.');
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcastSuccess = () => {
        // Refresh logic or tab switch could go here
        setRefreshHistoryTrigger(prev => prev + 1);
    };

    const renderOverview = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <button
                            onClick={fetchStats}
                            className="mt-2 text-sm underline hover:text-red-800"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Emails</h3>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalEmailThisMonth.toLocaleString()}</p>
                            <p className="text-xs text-slate-400 mt-1">Sent this month</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total SMS</h3>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSmsThisMonth.toLocaleString()}</p>
                            <p className="text-xs text-slate-400 mt-1">Sent this month</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Audience Reach</h3>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{((stats.totalClients || 0) + (stats.totalCoaches || 0)).toLocaleString()}</p>
                            <p className="text-xs text-slate-400 mt-1">Total active users (Clients + Coaches)</p>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">System Limits</h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <p>
                                    Metrics shown are aggregated across all active tenants. Individual tenant limits are enforced based on their plans.
                                    Tenants exceeding their monthly messaging allowance will be blocked from sending further messages until the next billing cycle or an upgrade.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-600 text-center">
                    <TrendingUp className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Delivery Analytics</h3>
                    <p className="text-slate-500 mt-1 max-w-md mx-auto">
                        Delivery rates, bounce tracking, and provider status dashboards are coming soon.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Global Messaging</h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor messaging activity and send global broadcasts</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`
                        whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                    `}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('broadcasts')}
                        className={`
                        whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                        ${activeTab === 'broadcasts'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                    `}
                    >
                        <Send size={16} /> Broadcasts
                    </button>
                </nav>
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'broadcasts' && (
                <div className="space-y-8">
                    <BroadcastComposer onSuccess={handleBroadcastSuccess} />
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Broadcast History</h3>
                        <BroadcastHistory key={refreshHistoryTrigger} />
                    </div>
                </div>
            )}
        </div>
    );
};


export default OwnerMessaging;
