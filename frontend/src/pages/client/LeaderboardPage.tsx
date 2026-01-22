import { useEffect, useState } from 'react';
import { Trophy, Medal, Shield, User } from 'lucide-react';
import { clientPortalService } from '../../services/client-portal.service';
import { useClientProfile } from '../../hooks/useClientProfile';
import { getImageUrl } from '../../utils/imageUtils';

interface LeaderboardEntry {
    rank: number;
    clientId: string;
    firstName: string;
    lastName: string;
    score: number;
    avatarUrl?: string;
    isCurrentUser: boolean;
}

export const LeaderboardPage = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { client } = useClientProfile();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await clientPortalService.getLeaderboard();
                setEntries(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const isHidden = client?.privacyPreferences?.leaderboard_visible === false;

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Loading leaderboard...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-500">
                    <Trophy size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Top performers by sessions completed</p>
                </div>
            </div>

            {isHidden && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
                    <Shield size={20} />
                    <span>You are currently hidden from the leaderboard. You can change this in Settings.</span>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {entries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No active players yet. Be the first!</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {entries.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${entry.isCurrentUser ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500' : ''
                                    }`}
                            >
                                <div className="w-8 font-bold text-gray-500 dark:text-gray-400 text-center text-lg">
                                    {entry.rank === 1 ? <Trophy className="text-yellow-500 mx-auto" size={24} /> :
                                        entry.rank === 2 ? <Medal className="text-gray-400 mx-auto" size={24} /> :
                                            entry.rank === 3 ? <Medal className="text-amber-600 mx-auto" size={24} /> :
                                                entry.rank}
                                </div>

                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                    {entry.avatarUrl && getImageUrl(entry.avatarUrl) ? (
                                        <img src={getImageUrl(entry.avatarUrl)!} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className={`font-semibold ${entry.isCurrentUser ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                        {entry.firstName} {entry.lastName.charAt(0)}.
                                        {entry.isCurrentUser && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 px-2 py-0.5 rounded-full">You</span>}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold text-gray-900 dark:text-white text-lg">{entry.score}</div>
                                    <div className="text-xs text-gray-500">Sessions</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
