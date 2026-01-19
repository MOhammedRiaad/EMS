import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Package, Clock, TrendingUp, Zap, X, List, ChevronRight, Bell } from 'lucide-react';
import type { DashboardNotification } from '../../services/client-notifications.service';
import type { WaitingListEntry } from './useClientHomeState';

// Notifications Section
interface NotificationsSectionProps {
    notifications: DashboardNotification[];
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({ notifications }) => {
    if (notifications.length === 0) return null;

    return (
        <section className="space-y-3">
            {notifications.map(notification => (
                <div key={notification.id} className={`p-4 rounded-xl border flex gap-3 ${notification.priority === 'high'
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                    }`}>
                    <div className={`mt-0.5 ${notification.priority === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        <Bell size={18} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-sm font-bold ${notification.priority === 'high' ? 'text-red-900 dark:text-red-200' : 'text-amber-900 dark:text-amber-200'}`}>
                            {notification.title}
                        </h3>
                        <p className={`text-xs mt-1 ${notification.priority === 'high' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                            {notification.message}
                        </p>
                        {notification.link && (
                            <Link to={notification.link} className={`text-xs font-semibold mt-2 inline-flex items-center ${notification.priority === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                View Details <ChevronRight size={12} className="ml-1" />
                            </Link>
                        )}
                    </div>
                </div>
            ))}
        </section>
    );
};

// Next Session Card
interface NextSessionCardProps {
    nextSession: {
        startTime: string;
        room?: { name: string };
    } | undefined;
}

export const NextSessionCard: React.FC<NextSessionCardProps> = ({ nextSession }) => {
    if (nextSession) {
        return (
            <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl">
                            <Clock className="text-blue-300" size={24} />
                        </div>
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">CONFIRMED</span>
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
                            <p className="text-sm text-gray-300 font-medium">{nextSession.room?.name || 'Studio Room'}</p>
                        </div>
                        <Link to="/client/schedule" className="flex items-center text-sm font-medium text-blue-300 hover:text-white transition-colors">
                            Details <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
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
    );
};

// Active Package Card
interface ActivePackageCardProps {
    activePackage: {
        package?: { name: string };
        sessionsRemaining: number;
        sessionsUsed: number;
        scheduledSessions?: number;
        availableSessions?: number;
        expiryDate: string;
    } | undefined;
}

export const ActivePackageCard: React.FC<ActivePackageCardProps> = ({ activePackage }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Plan</p>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg mt-1">{activePackage?.package?.name || 'No Plan'}</h3>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                    <Package size={20} />
                </div>
            </div>

            {activePackage ? (
                <>
                    <div className="space-y-2 mb-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Package Sessions</span>
                            <span className="font-bold text-gray-900 dark:text-white">{activePackage.sessionsRemaining} remaining</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Scheduled</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{activePackage.scheduledSessions || 0} sessions</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Available to Book</span>
                            <span className={`font-bold ${(activePackage.availableSessions || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {activePackage.availableSessions || 0} sessions
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 mt-2">
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
    );
};

// Waiting List Card
interface WaitingListCardProps {
    entries: WaitingListEntry[];
    onCancel: (id: string) => void;
}

export const WaitingListCard: React.FC<WaitingListCardProps> = ({ entries, onCancel }) => {
    if (entries.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
                <List size={18} className="text-orange-500" />
                <span className="font-semibold text-gray-800 dark:text-gray-200">Waiting List</span>
            </div>
            <div className="space-y-2">
                {entries.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                        <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">
                                {entry.preferredDate ? new Date(entry.preferredDate).toLocaleDateString() : 'Any Date'}
                                {entry.preferredTimeSlot && ` · ${entry.preferredTimeSlot}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {entry.studio?.name || 'Studio'} ·{' '}
                                <span className={`font-medium ${entry.status === 'notified' ? 'text-green-600 dark:text-green-400' :
                                    entry.status === 'approved' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                                    }`}>
                                    {entry.status === 'notified' ? '📧 Notified!' :
                                        entry.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => onCancel(entry.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel Request"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Quick Actions
export const QuickActionsCard: React.FC = () => (
    <div className="grid grid-cols-2 gap-3">
        <Link to="/client/schedule" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <Calendar size={24} className="text-blue-500 mb-2" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Schedule</span>
        </Link>
        <Link to="/client/progress" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <TrendingUp size={24} className="text-green-500 mb-2" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
        </Link>
    </div>
);

// Booking Promo Card
export const BookingPromoCard: React.FC = () => (
    <section className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-5 border border-dashed border-gray-200 dark:border-slate-800">
        <div className="flex items-center space-x-4">
            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full text-orange-600 dark:text-orange-400">
                <Zap size={20} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">Feel like training today?</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Check available slots for today.</p>
            </div>
            <Link to="/client/book" className="bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                Check
            </Link>
        </div>
    </section>
);
