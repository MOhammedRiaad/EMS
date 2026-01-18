import { useState, useEffect } from 'react';
import { coachPortalService, type CoachSession, type CoachDashboardStats } from '../../services/coach-portal.service';
import { Calendar, ChevronRight, ChevronDown, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

const CoachHome = () => {
    const [stats, setStats] = useState<CoachDashboardStats | null>(null);
    const [sessions, setSessions] = useState<CoachSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleDays, setVisibleDays] = useState(7);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [dashboardData, sessionsData] = await Promise.all([
                coachPortalService.getDashboard(),
                coachPortalService.getSchedule('future') // Fetch all upcoming sessions
            ]);
            setStats(dashboardData);
            setSessions(sessionsData);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (sessionId: string, newStatus: 'completed' | 'no_show' | 'cancelled') => {
        const action = newStatus === 'completed' ? 'Complete' : newStatus === 'no_show' ? 'No Show' : 'Cancel';
        if (!confirm(`Mark session as ${action}?`)) return;

        try {
            await coachPortalService.updateSessionStatus(sessionId, newStatus);
            // Optimistic update
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: newStatus } : s));
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        }
    };

    // Group sessions by date
    const groupedSessions = sessions.reduce((groups, session) => {
        const date = new Date(session.startTime).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(session);
        return groups;
    }, {} as Record<string, CoachSession[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Pagination logic
    const displayedDates = sortedDates.slice(0, visibleDays);
    const hasMore = sortedDates.length > visibleDays;

    const getDateLabel = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toLocaleDateString() === today.toLocaleDateString()) return "Today";
        if (date.toLocaleDateString() === tomorrow.toLocaleDateString()) return "Tomorrow";
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl">
            {error}
        </div>
    );

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
            {/* Stats Overview */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-xl font-bold mb-4">Dashboard</h1>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                        <div className="text-3xl font-bold">{stats?.sessionsCount || 0}</div>
                        <div className="text-blue-100 text-sm">Today's Sessions</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                        <div className="text-lg font-semibold truncate">
                            {stats?.nextSession
                                ? new Date(stats.nextSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Done'}
                        </div>
                        <div className="text-blue-100 text-sm">Next Up</div>
                    </div>
                </div>
            </div>

            {/* Upcoming Schedule */}
            <div>
                <h2 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                    Upcoming Schedule
                </h2>

                {sortedDates.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-2xl text-gray-500">
                        No upcoming sessions found.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {displayedDates.map(dateKey => (
                            <div key={dateKey}>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                                    {getDateLabel(dateKey)}
                                </h3>
                                <div className="space-y-3">
                                    {groupedSessions[dateKey].map(session => (
                                        <div key={session.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden transition-all hover:shadow-md">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-lg text-sm">
                                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{session.client.firstName} {session.client.lastName}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <div className={`w-2 h-2 rounded-full ${session.status === 'scheduled' ? 'bg-blue-500' :
                                                                session.status === 'completed' ? 'bg-green-500' :
                                                                    session.status === 'no_show' ? 'bg-red-500' : 'bg-gray-400'
                                                                }`}></div>
                                                            {session.status.replace('_', ' ').toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link to={`/coach/clients/${session.client.id}`} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-50">
                                                    <ChevronRight size={20} />
                                                </Link>
                                            </div>

                                            {session.notes && (
                                                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 mb-3 mx-1">
                                                    "{session.notes}"
                                                </div>
                                            )}

                                            {session.status === 'scheduled' && (
                                                <div className="flex gap-2 mt-2 pt-3 border-t border-gray-50 dark:border-slate-800">
                                                    <button
                                                        onClick={() => handleStatusUpdate(session.id, 'completed')}
                                                        className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-green-100 transition-colors"
                                                    >
                                                        <CheckCircle size={14} /> Complete
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(session.id, 'no_show')}
                                                        className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-orange-100 transition-colors"
                                                    >
                                                        <XCircle size={14} /> No Show
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                                                        className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors"
                                                    >
                                                        <Ban size={14} /> Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {hasMore && (
                            <button
                                onClick={() => setVisibleDays(prev => prev + 7)}
                                className="w-full py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <ChevronDown size={18} />
                                Show More Sessions
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachHome;
