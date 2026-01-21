import React, { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, Minus, Target, Trophy, Flame, Scale, Dumbbell, Percent } from 'lucide-react';
import type { InBodyScan } from '../../services/inbody.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// Animated Number Component
// ============================================================================
const AnimatedNumber: React.FC<{ value: number | string; decimals?: number; duration?: number }> = ({
    value,
    decimals = 1,
    duration = 1000
}) => {
    // Parse value to number (handles both number and string inputs)
    const parseValue = (v: number | string): number => {
        if (typeof v === 'number' && !isNaN(v)) return v;
        if (typeof v === 'string') {
            const parsed = parseFloat(v);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    const targetValue = parseValue(value);
    const [displayValue, setDisplayValue] = useState(targetValue);

    useEffect(() => {
        const newTarget = parseValue(value);
        const steps = 30;
        const increment = newTarget / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= newTarget) {
                setDisplayValue(newTarget);
                clearInterval(timer);
            } else {
                setDisplayValue(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value, duration]);

    return <span className="tabular-nums">{displayValue.toFixed(decimals)}</span>;
};

// ============================================================================
// Trend Indicator Component
// ============================================================================
interface TrendIndicatorProps {
    current: number;
    previous?: number;
    inverse?: boolean; // true if lower is better (like body fat)
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ current, previous, inverse = false }) => {
    if (!previous) return null;

    const diff = current - previous;
    const percentage = ((diff / previous) * 100).toFixed(1);

    if (Math.abs(diff) < 0.1) {
        return (
            <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                <Minus size={12} />
                <span>No change</span>
            </div>
        );
    }

    const isPositive = inverse ? diff < 0 : diff > 0;

    return (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
            {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{diff > 0 ? '+' : ''}{diff.toFixed(1)} ({percentage}%)</span>
        </div>
    );
};

// ============================================================================
// StatsCards - Premium Animated Version
// ============================================================================

export interface StatsCardsProps {
    latestScan: InBodyScan;
    previousScan?: InBodyScan;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ latestScan, previousScan }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
        {/* Weight Card */}
        <div className="premium-card p-5 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-100 to-transparent dark:from-slate-800 rounded-full -mr-8 -mt-8 opacity-50" />
            <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scale className="text-gray-600 dark:text-gray-300" size={24} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">Weight</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    <AnimatedNumber value={latestScan.weight} />
                    <span className="text-sm font-normal text-gray-400 ml-1">kg</span>
                </div>
                <TrendIndicator current={latestScan.weight} previous={previousScan?.weight} />
            </div>
        </div>

        {/* Muscle Card */}
        <div className="premium-card p-5 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-900/20 rounded-full -mr-8 -mt-8 opacity-50" />
            <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                    <Dumbbell className="text-white" size={24} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">Muscle Mass</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    <AnimatedNumber value={latestScan.skeletalMuscleMass} />
                    <span className="text-sm font-normal text-gray-400 ml-1">kg</span>
                </div>
                <TrendIndicator current={latestScan.skeletalMuscleMass} previous={previousScan?.skeletalMuscleMass} />
            </div>
        </div>

        {/* Body Fat Card */}
        <div className="premium-card p-5 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-transparent dark:from-orange-900/20 rounded-full -mr-8 -mt-8 opacity-50" />
            <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                    <Percent className="text-white" size={24} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">Body Fat</div>
                <div className="text-3xl font-bold text-orange-500 dark:text-orange-400 mb-1">
                    <AnimatedNumber value={latestScan.bodyFatPercentage} />
                    <span className="text-sm font-normal text-gray-400 ml-1">%</span>
                </div>
                <TrendIndicator current={latestScan.bodyFatPercentage} previous={previousScan?.bodyFatPercentage} inverse />
            </div>
        </div>
    </div>
);

// ============================================================================
// Goal Progress Card
// ============================================================================

export interface GoalProgressProps {
    currentWeight: number;
    targetWeight?: number;
    currentBodyFat: number;
    targetBodyFat?: number;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
    currentWeight,
    targetWeight = currentWeight - 5,
    currentBodyFat,
    targetBodyFat = currentBodyFat - 5
}) => {
    const weightProgress = Math.min(100, Math.max(0, ((currentWeight - targetWeight) / (currentWeight * 0.2)) * 100));
    const fatProgress = Math.min(100, Math.max(0, ((currentBodyFat - targetBodyFat) / currentBodyFat) * 100));

    return (
        <div className="premium-card p-5 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Target size={18} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Goal Progress</h3>
            </div>

            <div className="space-y-4">
                {/* Weight Goal */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Weight Goal</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{currentWeight}kg → {targetWeight}kg</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                            style={{ width: `${weightProgress}%` }}
                        />
                    </div>
                </div>

                {/* Body Fat Goal */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Body Fat Goal</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{currentBodyFat}% → {targetBodyFat}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-1000"
                            style={{ width: `${fatProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Achievement Badges
// ============================================================================

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    unlockedAt?: string;
}

export const AchievementBadges: React.FC<{ sessionCount: number }> = ({ sessionCount }) => {
    const achievements: Achievement[] = [
        {
            id: 'first',
            title: 'First Session',
            description: 'Complete your first EMS session',
            icon: <Trophy className="text-yellow-500\" size={20} />,
            unlocked: sessionCount >= 1,
        },
        {
            id: 'streak5',
            title: '5 Sessions',
            description: 'Complete 5 EMS sessions',
            icon: <Flame className="text-orange-500" size={20} />,
            unlocked: sessionCount >= 5,
        },
        {
            id: 'streak10',
            title: '10 Sessions',
            description: 'Reach 10 completed sessions',
            icon: <Dumbbell className="text-blue-500" size={20} />,
            unlocked: sessionCount >= 10,
        },
        {
            id: 'streak25',
            title: 'Dedicated',
            description: 'Complete 25 sessions',
            icon: <Target className="text-purple-500" size={20} />,
            unlocked: sessionCount >= 25,
        },
    ];

    return (
        <div className="premium-card p-5 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                    <Trophy size={18} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Achievements</h3>
                <span className="ml-auto text-sm text-gray-500">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {achievements.map((achievement, index) => (
                    <div
                        key={achievement.id}
                        className={`p-3 rounded-xl text-center transition-all ${achievement.unlocked
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-gray-50 dark:bg-slate-800 opacity-50'
                            }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${achievement.unlocked
                            ? 'bg-white dark:bg-slate-900 shadow-sm'
                            : 'bg-gray-200 dark:bg-slate-700'
                            }`}>
                            {achievement.unlocked ? achievement.icon : <span className="text-gray-400">🔒</span>}
                        </div>
                        <div className={`text-xs font-medium ${achievement.unlocked ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                            {achievement.title}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// ScanHistoryList - Enhanced Version
// ============================================================================

export interface ScanHistoryListProps {
    scans: InBodyScan[];
}

export const ScanHistoryList: React.FC<ScanHistoryListProps> = ({ scans }) => (
    <div className="premium-card overflow-hidden animate-fade-in-up stagger-4">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-800 dark:text-white">Scan History</span>
            <span className="badge bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 ml-auto">{scans.length}</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {scans.map((scan, index) => (
                <div
                    key={scan.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                                {new Date(scan.scanDate).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Scale size={12} />
                                    {scan.weight}kg
                                </span>
                                <span className="flex items-center gap-1">
                                    <Dumbbell size={12} />
                                    {scan.skeletalMuscleMass}kg
                                </span>
                                <span className="flex items-center gap-1">
                                    <Percent size={12} />
                                    {scan.bodyFatPercentage}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {scan.fileUrl && (
                        <a
                            href={`${API_URL}/storage/${scan.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-90"
                            title="Download Report"
                        >
                            <Download size={20} />
                        </a>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// ============================================================================
// EmptyScansState - Enhanced Version
// ============================================================================

export const EmptyScansState: React.FC = () => (
    <div className="premium-card p-12 text-center animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <TrendingUp size={36} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Progress Data Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
            Complete your first InBody scan to start tracking your body composition journey.
        </p>
    </div>
);

