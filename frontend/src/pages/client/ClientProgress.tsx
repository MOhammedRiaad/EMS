import { TrendingUp, Target } from 'lucide-react';
import InBodyTrendsChart from '../inbody/InBodyTrendsChart';
import { useClientProgressState } from './useClientProgressState';
import { StatsCards, ScanHistoryList, EmptyScansState, GoalProgress, AchievementBadges } from './ClientProgressComponents';

const ClientProgress = () => {
    const { scans, latestScan, loading, error } = useClientProgressState();
    const previousScan = scans.length > 1 ? scans[1] : undefined;

    // Demo session count - in real app, fetch from API
    const sessionCount = scans.length * 3;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-green-200 dark:border-slate-700"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-green-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl inline-block">{error}</div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

            <div className="relative p-6 space-y-6 pb-24 max-w-lg mx-auto md:max-w-4xl">
                {/* Header */}
                <header className="animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
                            <TrendingUp size={20} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Progress</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm ml-12">Track your body composition journey</p>
                </header>

                {/* Latest Stats Cards */}
                {latestScan && <StatsCards latestScan={latestScan} previousScan={previousScan} />}

                {/* Goal Progress */}
                {latestScan && (
                    <GoalProgress
                        currentWeight={latestScan.weight}
                        currentBodyFat={latestScan.bodyFatPercentage}
                    />
                )}

                {/* Achievement Badges */}
                <AchievementBadges sessionCount={sessionCount} />

                {/* Charts */}
                {scans.length > 0 ? (
                    <div className="premium-card p-5 animate-fade-in-up">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Target size={18} />
                            </div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">Trends</h3>
                        </div>
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
        </div>
    );
};

export default ClientProgress;

