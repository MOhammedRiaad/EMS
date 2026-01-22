import React, { useEffect, useState } from 'react';
import { AchievementBadge } from './AchievementBadge';
import { clientPortalService } from '../../../services/client-portal.service';

export const AchievementsSection: React.FC = () => {
    const [achievements, setAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        try {
            const data = await clientPortalService.getAchievements();
            setAchievements(data);
        } catch (error) {
            console.error('Failed to load achievements', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;

    if (achievements.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Achievements</h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="mb-3 text-4xl">🎯</div>
                    <p>No achievements yet.</p>
                    <p className="text-sm mt-1">Complete sessions to unlock badges!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                <span>🏆</span> Your Achievements ({achievements.length})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {achievements.map((ach) => (
                    <div key={ach.id} className="flex justify-center">
                        <AchievementBadge
                            type={ach.achievementType}
                            unlockedAt={ach.achievedAt}
                            size="md"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
