import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, Clock, Workflow } from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';

interface AutomationStats {
    totalExecutions: number;
    activeRules: number;
    failedExecutions: number;
    executionsToday: number;
}

const OwnerAutomations = () => {
    const [stats, setStats] = useState<AutomationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await ownerPortalService.getAutomationStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch automation stats:', err);
            setError('Could not load automation statistics.');
        } finally {
            setLoading(false);
        }
    };

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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Global Automations</h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor automation activity across all tenants</p>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
                    Beta Feature
                </span>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Executions</h3>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalExecutions.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">Lifetime executions</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Rules</h3>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeRules.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">Across all tenants</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Activity</h3>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.executionsToday.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">Executions since midnight</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Failed Executions</h3>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.failedExecutions.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">Total failures</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-600 text-center">
                <Workflow className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Detailed Analytics</h3>
                <p className="text-slate-500 mt-1 max-w-md mx-auto">
                    Detailed breakdown by tenant, execution history heatmaps, and rule performance metrics are coming soon.
                </p>
            </div>
        </div>
    );
};

export default OwnerAutomations;
