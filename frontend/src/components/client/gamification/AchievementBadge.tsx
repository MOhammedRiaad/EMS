import React from 'react';
import { Trophy, Zap, Flame, Star, Medal, Award } from 'lucide-react';
import { AchievementType } from '../../../types/gamification';

interface AchievementBadgeProps {
    type: AchievementType | string;
    unlockedAt?: string | Date;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

const getAchievementConfig = (type: string) => {
    switch (type) {
        case AchievementType.SESSIONS_5:
            return { icon: Zap, label: 'High Five', description: 'Complete 5 sessions', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
        case AchievementType.SESSIONS_10:
            return { icon: Medal, label: 'Regular', description: 'Complete 10 sessions', color: 'text-orange-500', bg: 'bg-orange-500/10' };
        case AchievementType.SESSIONS_25:
            return { icon: Award, label: 'Dedicated', description: 'Complete 25 sessions', color: 'text-purple-500', bg: 'bg-purple-500/10' };
        case AchievementType.SESSIONS_50:
            return { icon: Trophy, label: 'Elite', description: 'Complete 50 sessions', color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
        case AchievementType.SESSIONS_100:
            return { icon: Trophy, label: 'Legend', description: 'Complete 100 sessions', color: 'text-amber-500', bg: 'bg-amber-500/10' };

        case AchievementType.STREAK_7_DAYS:
            return { icon: Flame, label: 'On Fire', description: '7 day streak', color: 'text-red-500', bg: 'bg-red-500/10' };
        case AchievementType.STREAK_30_DAYS:
            return { icon: Flame, label: 'Unstoppable', description: '30 day streak', color: 'text-red-600', bg: 'bg-red-600/10' };

        case AchievementType.FIRST_REVIEW:
            return { icon: Star, label: 'Voice', description: 'First review', color: 'text-blue-400', bg: 'bg-blue-400/10' };

        default:
            return { icon: Award, label: 'Achievement', description: 'Goal reached', color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ type, unlockedAt, size = 'md', showLabel = true }) => {
    const config = getAchievementConfig(type);
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'w-8 h-8 p-1.5',
        md: 'w-12 h-12 p-3',
        lg: 'w-16 h-16 p-4',
    };

    const iconSizes = {
        sm: 16,
        md: 24,
        lg: 32,
    };

    return (
        <div className={`flex flex-col items-center ${unlockedAt ? '' : 'opacity-50 grayscale'}`}>
            <div className={`rounded-full flex items-center justify-center ${config.bg} ${config.color} ${sizeClasses[size]} transition-transform hover:scale-110 shadow-lg shadow-${config.color.split('-')[1]}-500/20`}>
                <Icon size={iconSizes[size]} fill={unlockedAt ? "currentColor" : "none"} strokeWidth={2.5} />
            </div>
            {showLabel && (
                <div className="mt-2 text-center">
                    <div className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white">{config.label}</div>
                    {/* <div className="text-[10px] text-gray-500 dark:text-gray-400">{config.description}</div> */}
                </div>
            )}
        </div>
    );
};
