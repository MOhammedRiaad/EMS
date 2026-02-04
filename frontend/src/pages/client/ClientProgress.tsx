import { useState } from 'react';
import { TrendingUp, Target, Lock } from 'lucide-react';
import InBodyTrendsChart from '../inbody/InBodyTrendsChart';
import { useClientProgressState } from './useClientProgressState';
import { StatsCards, ScanHistoryList, EmptyScansState, GoalProgress } from './ClientProgressComponents';
import { AchievementsSection } from '../../components/client/gamification/AchievementsSection';
import { useClientGoals } from '../../hooks/useClientGoals';
import { GoalSettingModal } from '../../components/client/gamification/GoalSettingModal';
import { useAuth } from '../../contexts/AuthContext';

const ClientProgress = () => {
    const { isEnabled } = useAuth();
    const { scans, latestScan, loading, error } = useClientProgressState();
    const { goals, refetch: refetchGoals } = useClientGoals();
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const previousScan = scans.length > 1 ? scans[1] : undefined;

    const weightGoal = goals.find((g: any) => g.goalType === 'weight')?.targetValue;
    const bodyFatGoal = goals.find((g: any) => g.goalType === 'body_fat')?.targetValue;

    const showGoals = isEnabled('client.goals');
    const showAchievements = isEnabled('client.achievements');

    if (!isEnabled('client.inbody_scans') && !showGoals && !showAchievements) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                    <Lock size={48} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Feature Not Available</h2>
                <p className="text-gray-500 max-w-md">Progress tracking is currently disabled for this studio.</p>
            </div>
        );
    }

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
                {latestScan && showGoals && (
                    <div className="relative mb-6 group">
                        <GoalProgress
                            currentWeight={latestScan.weight}
                            currentBodyFat={latestScan.bodyFatPercentage}
                            targetWeight={weightGoal}
                            targetBodyFat={bodyFatGoal}
                        />
                        <button
                            onClick={() => setIsGoalModalOpen(true)}
                            className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 text-gray-700 dark:text-gray-200 rounded-lg transition-all text-xs font-semibold flex items-center gap-1 backdrop-blur-sm opacity-100 md:opacity-0 group-hover:opacity-100"
                            title="Update Goals"
                        >
                            <Target size={14} /> Update Goals
                        </button>
                    </div>
                )}

                {/* Achievement Badges */}
                {showAchievements && <AchievementsSection />}

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

                <GoalSettingModal
                    isOpen={isGoalModalOpen}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSuccess={refetchGoals}
                />
            </div>
        </div>
    );
};

export default ClientProgress;

