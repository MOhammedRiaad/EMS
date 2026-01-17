import { useState, useEffect } from 'react';
import { clientPortalService, type ClientDashboardData } from '../../services/client-portal.service';
import { Calendar, Package, Clock, TrendingUp, Zap, X, List, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface WaitingListEntry {
    id: string;
    preferredDate: string | null;
    preferredTimeSlot: string | null;
    status: 'pending' | 'approved' | 'notified' | 'booked' | 'cancelled';
    studio: { id: string; name: string } | null;
    createdAt: string;
    notifiedAt: string | null;
}

const ClientHome = () => {
    const { user } = useAuth();
    const [data, setData] = useState<ClientDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [dashboardResult, waitingListResult] = await Promise.all([
                    clientPortalService.getDashboard(),
                    clientPortalService.getMyWaitingList()
                ]);
                setData(dashboardResult);
                setWaitingList(waitingListResult.filter((e: WaitingListEntry) =>
                    e.status !== 'cancelled' && e.status !== 'booked'
                ));
            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                setError(err.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const handleCancelWaitingList = async (id: string) => {
        if (!confirm('Cancel this waiting list request?')) return;
        try {
            await clientPortalService.cancelWaitingListEntry(id);
            setWaitingList(prev => prev.filter(e => e.id !== id));
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(err.message || 'Failed to cancel');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block">{error}</div>
        </div>
    );

    const { nextSession, activePackage } = data || {};

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="p-6 space-y-8 pb-24 max-w-lg mx-auto md:max-w-4xl">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {getGreeting()},<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            {user?.firstName || 'Client'}
                        </span>
                    </h1>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg border-2 border-white shadow-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            </header>

            {/* Main Action Card (Next Session or Booking) */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-gray-800 text-lg">Up Next</h2>
                </div>

                {nextSession ? (
                    <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl">
                                    <Clock className="text-blue-300" size={24} />
                                </div>
                                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    CONFIRMED
                                </span>
                            </div>

                            <div className="space-y-1 mb-6">
                                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                                    {new Date(nextSession.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <h3 className="text-3xl font-bold tracking-tight">
                                    {new Date(nextSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </h3>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    <p className="text-sm text-gray-300 font-medium">
                                        {nextSession.room?.name || 'Studio Room'}
                                    </p>
                                </div>
                                <Link to="/client/schedule" className="flex items-center text-sm font-medium text-blue-300 hover:text-white transition-colors">
                                    Details <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20 text-center py-10">
                        <Zap className="mx-auto mb-4 text-blue-200" size={48} />
                        <h3 className="text-xl font-bold mb-2">Ready to work out?</h3>
                        <p className="text-blue-100 mb-6 text-sm">You have no upcoming sessions scheduled.</p>
                        <Link
                            to="/client/book"
                            className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            <Calendar size={18} className="mr-2" />
                            Book a Session
                        </Link>
                    </div>
                )}
            </section>

            {/* Active Plan & Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active Plan</p>
                            <h3 className="font-bold text-gray-800 text-lg mt-1">{activePackage?.package?.name || 'No Plan'}</h3>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                            <Package size={20} />
                        </div>
                    </div>

                    {activePackage ? (
                        <>
                            <div className="space-y-2 mb-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Package Sessions</span>
                                    <span className="font-bold text-gray-900">{activePackage.sessionsRemaining} remaining</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Scheduled</span>
                                    <span className="font-semibold text-blue-600">{activePackage.scheduledSessions || 0} sessions</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Available to Book</span>
                                    <span className={`font-bold ${(activePackage.availableSessions || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {activePackage.availableSessions || 0} sessions
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (activePackage.sessionsRemaining / (activePackage.sessionsUsed + activePackage.sessionsRemaining)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400">Expires {new Date(activePackage.expiryDate).toLocaleDateString()}</p>
                        </>
                    ) : (
                        <div className="mt-2">
                            <Link to="/client/profile" className="text-sm text-purple-600 font-medium">View packages &rarr;</Link>
                        </div>
                    )}
                </div>

                {/* Waiting List Entries */}
                {waitingList.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <List size={18} className="text-orange-500" />
                            <span className="font-semibold text-gray-800">Waiting List</span>
                        </div>
                        <div className="space-y-2">
                            {waitingList.map(entry => (
                                <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">
                                            {entry.preferredDate
                                                ? new Date(entry.preferredDate).toLocaleDateString()
                                                : 'Any Date'}
                                            {entry.preferredTimeSlot && ` · ${entry.preferredTimeSlot}`}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {entry.studio?.name || 'Studio'} ·{' '}
                                            <span className={`font-medium ${entry.status === 'notified' ? 'text-green-600' :
                                                entry.status === 'approved' ? 'text-blue-600' : 'text-orange-600'
                                                }`}>
                                                {entry.status === 'notified' ? '📧 Notified!' :
                                                    entry.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCancelWaitingList(entry.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Cancel Request"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Link to="/client/schedule" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center hover:bg-gray-50 transition-colors">
                        <Calendar size={24} className="text-blue-500 mb-2" />
                        <span className="text-sm font-semibold text-gray-700">Schedule</span>
                    </Link>
                    <Link to="/client/progress" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center hover:bg-gray-50 transition-colors">
                        <TrendingUp size={24} className="text-green-500 mb-2" />
                        <span className="text-sm font-semibold text-gray-700">Progress</span>
                    </Link>
                </div>
            </section>

            {/* Booking Teaser / Promo */}
            <section className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200">
                <div className="flex items-center space-x-4">
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                        <Zap size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm">Feel like training today?</h4>
                        <p className="text-xs text-gray-500">Check available slots for today.</p>
                    </div>
                    <Link to="/client/book" className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
                        Check
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default ClientHome;
