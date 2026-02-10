import { useEffect, useState } from 'react';
import { Trophy, Shield, User, Crown, Flame, TrendingUp, Lock } from 'lucide-react';
import { clientPortalService } from '../../services/client-portal.service';
import { useClientProfile } from '../../hooks/useClientProfile';
import { useAuth } from '../../contexts/AuthContext';
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
    const { isEnabled } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { client } = useClientProfile();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!isEnabled('client.leaderboard')) {
                setLoading(false);
                return;
            }
            try {
                // Mock delay for animation effect
                // await new Promise(r => setTimeout(r, 800)); 
                const data = await clientPortalService.getLeaderboard();
                setEntries(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [isEnabled]);

    if (!isEnabled('client.leaderboard')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                    <Lock size={48} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Feature Not Available</h2>
                <p className="text-gray-500 max-w-md">The leaderboard feature is currently disabled for this studio.</p>
            </div>
        );
    }

    const isHidden = client?.privacyPreferences?.leaderboard_visible === false;
    const topThree = entries.slice(0, 3);
    const restOfList = entries.slice(3);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-100 dark:border-slate-800"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                </div>
                <p className="text-gray-400 animate-pulse">Loading rankings...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 pb-24 min-h-screen">
            {/* Header */}
            <div className="text-center py-8 animate-fade-in-down">
                <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-amber-600 dark:text-amber-500 shadow-lg shadow-amber-500/10">
                    <Trophy size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leaderboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Top performers this month</p>
            </div>

            {/* Privacy Warning */}
            {isHidden && (
                <div className="mb-16 w-full p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-100 dark:border-blue-800/50 rounded-2xl flex items-start gap-4 text-sm text-blue-700 dark:text-blue-300 animate-fade-in-up shadow-sm">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shrink-0 mt-0.5">
                        <Shield size={18} />
                    </div>
                    <span className="flex-1 leading-relaxed">
                        You are hidden from the leaderboard. Change this in <a href="/client/privacy" className="underline font-semibold hover:text-blue-800 dark:hover:text-blue-200">Settings</a>.
                    </span>
                </div>
            )}

            {/* Podium Section */}
            {(topThree.length > 0) && (
                <div className="relative flex justify-center items-end gap-3 sm:gap-6 mb-16 h-80 pt-10 mt-[100px]">
                    {/* Rank 2 - Left */}
                    <div className="relative flex flex-col items-center gap-2 group flex-1 min-w-[110px] sm:max-w-[160px] z-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        {topThree[1] ? (
                            <>
                                <div className="relative cursor-pointer">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 dark:border-slate-600 overflow-hidden shadow-xl shadow-slate-500/20 group-hover:scale-105 transition-transform duration-300">
                                        {topThree[1].avatarUrl ? (
                                            <img src={getImageUrl(topThree[1].avatarUrl)!} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <User className="text-slate-400" size={28} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">#2</div>
                                </div>
                                <div className="text-center w-full">
                                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate w-full px-1">{topThree[1].firstName}</div>
                                    <div className="text-xs text-slate-500 font-semibold">{topThree[1].score} pts</div>
                                </div>
                                <div className="w-full h-28 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            </>
                        ) : (
                            // Placeholder for Layout Stability
                            <div className="w-full h-28 mt-auto opacity-0" />
                        )}
                    </div>

                    {/* Rank 1 - Center - Always Visible if list not empty */}
                    <div className="relative flex flex-col items-center gap-2 group flex-1 min-w-[130px] sm:max-w-[180px] z-20 -mt-8 animate-slide-up">
                        {topThree[0] && (
                            <>
                                <div className="relative flex flex-col items-center cursor-pointer">
                                    <Crown className="mb-2 text-yellow-500 animate-bounce drop-shadow-lg" size={48} fill="currentColor" />
                                    <div className="relative">
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-yellow-400 dark:border-yellow-500 overflow-hidden shadow-2xl shadow-yellow-500/30 group-hover:scale-105 transition-transform duration-300 ring-4 ring-yellow-400/20">
                                            {topThree[0].avatarUrl ? (
                                                <img src={getImageUrl(topThree[0].avatarUrl)!} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                                                    <User className="text-yellow-400" size={40} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-sm font-bold px-4 py-0.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                                            #1
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-3 w-full">
                                    <div className="font-bold text-gray-900 dark:text-white text-lg truncate w-full px-1">{topThree[0].firstName}</div>
                                    <div className="text-base text-yellow-600 dark:text-yellow-400 font-bold">{topThree[0].score} pts</div>
                                </div>
                                <div className="w-full h-44 bg-gradient-to-t from-yellow-200 to-yellow-100 dark:from-yellow-900/60 dark:to-yellow-800/60 rounded-t-xl shadow-lg shadow-yellow-500/10 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                            </>
                        )}
                    </div>

                    {/* Rank 3 - Right */}
                    <div className="relative flex flex-col items-center gap-2 group flex-1 min-w-[110px] sm:max-w-[160px] z-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        {topThree[2] ? (
                            <>
                                <div className="relative cursor-pointer">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-300 dark:border-orange-700 overflow-hidden shadow-xl shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                                        {topThree[2].avatarUrl ? (
                                            <img src={getImageUrl(topThree[2].avatarUrl)!} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                                <User className="text-orange-400" size={28} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">#3</div>
                                </div>
                                <div className="text-center w-full">
                                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate w-full px-1">{topThree[2].firstName}</div>
                                    <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">{topThree[2].score} pts</div>
                                </div>
                                <div className="w-full h-20 bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-900/60 dark:to-orange-800/60 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            </>
                        ) : (
                            // Placeholder for Layout Stability
                            <div className="w-full h-20 mt-auto opacity-0" />
                        )}
                    </div>
                </div>
            )}

            {/* List Section */}
            <div className="space-y-3 animate-fade-in-up stagger-3">
                {restOfList.length === 0 && topThree.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                        <Flame className="mx-auto text-gray-300 dark:text-slate-600 mb-3" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">No champions yet. Be the first to join!</p>
                    </div>
                ) : (
                    restOfList.map((entry, index) => (
                        <div
                            key={entry.rank}
                            className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${entry.isCurrentUser
                                ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5 scale-105 z-10 my-4 ring-2 ring-blue-500/20'
                                : 'bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 hover:shadow-md'
                                }`}
                            style={{ animationDelay: `${(index + 3) * 50}ms` }}
                        >
                            <div className="font-bold text-gray-400 w-6 text-center">{entry.rank}</div>

                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden ring-2 ring-white dark:ring-slate-800">
                                    {entry.avatarUrl ? (
                                        <img src={getImageUrl(entry.avatarUrl)!} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User size={20} className="text-gray-300 dark:text-slate-600" />
                                        </div>
                                    )}
                                </div>
                                {entry.isCurrentUser && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 ring-2 ring-white dark:ring-slate-900">
                                        <TrendingUp size={10} className="text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className={`font-bold ${entry.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                    {entry.firstName} {entry.lastName.charAt(0)}.
                                </div>
                                {entry.isCurrentUser && (
                                    <div className="text-xs text-blue-500 font-medium">That's you! Keep pushing 🔥</div>
                                )}
                            </div>

                            <div className="text-right">
                                <div className="font-black text-lg text-gray-900 dark:text-white">{entry.score}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Sessions</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
