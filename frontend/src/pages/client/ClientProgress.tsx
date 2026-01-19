import { TrendingUp } from 'lucide-react';
import InBodyTrendsChart from '../inbody/InBodyTrendsChart';
import { useClientProgressState } from './useClientProgressState';
import { StatsCards, ScanHistoryList, EmptyScansState } from './ClientProgressComponents';

const ClientProgress = () => {
    const { scans, latestScan, loading, error } = useClientProgressState();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 pb-24 max-w-lg mx-auto md:max-w-4xl">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-blue-600 dark:text-blue-400" />
                    My Progress
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your body composition journey</p>
            </header>

            {/* Latest Stats Cards */}
            {latestScan && <StatsCards latestScan={latestScan} />}

            {/* Charts */}
            {scans.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Trends</h3>
                    <div className="w-full">
                        <InBodyTrendsChart data={scans} />
                    </div>
                </div>
            ) : (
                <EmptyScansState />
            )}

            {/* History List */}
            {scans.length > 0 && <ScanHistoryList scans={scans} />}
        </div>
    );
};

export default ClientProgress;
