import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Package, Clock, TrendingUp, Zap, X, List, ChevronRight, Bell, Flame, Plus } from 'lucide-react';
import type { DashboardNotification } from '../../services/client-notifications.service';
import type { WaitingListEntry } from './useClientHomeState';

// ============================================================================
// Animated Counter Component
// ============================================================================
const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1000;
        const steps = 30;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return <span className="tabular-nums">{displayValue}{suffix}</span>;
};

// ============================================================================
// Progress Ring Component
// ============================================================================
const ProgressRing: React.FC<{
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}> = ({ progress, size = 120, strokeWidth = 8, color = '#667eea' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="progress-ring">
            {/* Background circle */}
            <circle
                stroke="currentColor"
                className="text-gray-200 dark:text-slate-700"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            {/* Progress circle */}
            <circle
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                className="progress-ring-circle"
                style={{
                    filter: `drop-shadow(0 0 8px ${color}40)`,
                    transition: 'stroke-dashoffset 1s ease-out'
                }}
            />
        </svg>
    );
};

// ============================================================================
// Countdown Timer Component
// ============================================================================
const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const diff = new Date(targetDate).getTime() - new Date().getTime();
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
        return <span className="text-green-400 font-bold animate-pulse">Starting Soon!</span>;
    }

    return (
        <div className="flex gap-3">
            {timeLeft.days > 0 && (
                <div className="text-center">
                    <div className="text-2xl font-bold text-white tabular-nums">{timeLeft.days}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">days</div>
                </div>
            )}
            <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">{timeLeft.hours}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">hrs</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-white tabular-nums">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">min</div>
            </div>
        </div>
    );
};

// ============================================================================
// Streak Badge Component
// ============================================================================
export const StreakBadge: React.FC<{ streak: number }> = ({ streak }) => {
    if (streak === 0) return null;

    return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold shadow-lg animate-bounce-in">
            <Flame size={16} className="animate-wiggle" />
            <span>{streak} Day Streak</span>
            <span className="text-orange-200">🔥</span>
        </div>
    );
};

// ============================================================================
// Notifications Section
// ============================================================================
interface NotificationsSectionProps {
    notifications: DashboardNotification[];
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({ notifications }) => {
    if (notifications.length === 0) return null;

    return (
        <section className="space-y-3 animate-fade-in-up">
            {notifications.map((notification, index) => (
                <div
                    key={notification.id}
                    className={`premium-card p-4 flex gap-3 stagger-${index + 1} ${notification.priority === 'high'
                        ? 'border-l-4 border-l-red-500'
                        : 'border-l-4 border-l-amber-500'
                        }`}
                >
                    <div className={`mt-0.5 ${notification.priority === 'high' ? 'text-red-500' : 'text-amber-500'}`}>
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
                            <Link to={notification.link} className={`text-xs font-semibold mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all ${notification.priority === 'high' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                View Details <ChevronRight size={12} />
                            </Link>
                        )}
                    </div>
                </div>
            ))}
        </section>
    );
};

// ============================================================================
// Next Session Card - Premium Glassmorphism Design
// ============================================================================
interface NextSessionCardProps {
    nextSession: {
        startTime: string;
        room?: { name: string };
        coach?: { user?: { firstName: string | null; lastName: string | null } };
    } | undefined;
    canBook?: boolean;
}

export const NextSessionCard: React.FC<NextSessionCardProps> = ({ nextSession, canBook = true }) => {
    if (nextSession) {
        return (
            <div className="relative overflow-hidden rounded-3xl animate-fade-in-up">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />

                {/* Decorative orbs */}
                <div className="orb orb-primary w-64 h-64 -top-20 -right-20 animate-float" />
                <div className="orb orb-accent w-48 h-48 -bottom-10 -left-10" style={{ animationDelay: '1s' }} />

                {/* Content */}
                <div className="relative z-10 p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="glass-card-dark p-3 rounded-xl">
                            <Clock className="text-purple-300" size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="pulse-dot" />
                            <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Confirmed</span>
                        </div>
                    </div>

                    <div className="space-y-1 mb-6">
                        <p className="text-purple-300 text-sm font-medium uppercase tracking-wider">
                            {new Date(nextSession.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <h3 className="text-4xl font-bold text-white tracking-tight">
                            {new Date(nextSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </h3>
                    </div>

                    {/* Countdown */}
                    <div className="mb-6">
                        <CountdownTimer targetDate={nextSession.startTime} />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                {nextSession.coach?.user?.firstName?.[0] || 'C'}
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">
                                    {nextSession.coach?.user?.firstName || 'Your Coach'}
                                </p>
                                <p className="text-gray-400 text-xs">{nextSession.room?.name || 'Studio Room'}</p>
                            </div>
                        </div>
                        <Link to="/client/schedule" className="btn-gradient px-4 py-2 text-sm flex items-center gap-1">
                            Details <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // No session - Show booking CTA
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-fade-in-up animate-gradient">
            <div className="orb orb-accent w-48 h-48 top-0 right-0 opacity-30" />

            <div className="relative z-10 p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center animate-float">
                    <Zap className="text-white" size={40} />
                </div>
                {canBook ? (
                    <>
                        <h3 className="text-2xl font-bold text-white mb-2">Ready to train?</h3>
                        <p className="text-purple-100 mb-6 text-sm">Book your next EMS session and crush your goals!</p>
                        <Link
                            to="/client/book"
                            className="inline-flex items-center bg-white text-purple-600 px-6 py-3 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all active:scale-95 hover:-translate-y-1"
                        >
                            <Calendar size={18} className="mr-2" />
                            Book Now
                        </Link>
                    </>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold text-white mb-2">No Upcoming Sessions</h3>
                        <p className="text-purple-100 mb-6 text-sm">Your scheduled sessions will appear here.</p>
                        <Link
                            to="/client/schedule"
                            className="inline-flex items-center bg-white/20 text-white border border-white/40 px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-all"
                        >
                            <Calendar size={18} className="mr-2" />
                            View Schedule
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Active Package Card - Radial Progress Design
// ============================================================================
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
    const totalSessions = activePackage ? (activePackage.sessionsUsed + activePackage.sessionsRemaining) : 0;
    const progressPercent = activePackage ? (activePackage.sessionsRemaining / totalSessions) * 100 : 0;

    return (
        <div className="premium-card p-5 animate-fade-in-up stagger-1">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Active Plan</p>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">{activePackage?.package?.name || 'No Plan'}</h3>

                    {activePackage && (
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Scheduled</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{activePackage.scheduledSessions || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Available</span>
                                <span className={`font-bold ${(activePackage.availableSessions || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                    {activePackage.availableSessions || 0}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                                Expires {new Date(activePackage.expiryDate).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                {activePackage && (
                    <div className="relative">
                        <ProgressRing progress={progressPercent} size={90} strokeWidth={6} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                <AnimatedNumber value={activePackage.sessionsRemaining} />
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">left</span>
                        </div>
                    </div>
                )}

                {!activePackage && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-purple-600 dark:text-purple-400">
                        <Package size={24} />
                    </div>
                )}
            </div>

            <Link to="/client/packages" className="text-sm text-purple-600 font-medium mt-4 inline-flex items-center gap-1 hover:gap-2 transition-all">
                {activePackage ? 'View Details' : 'View packages'} <ChevronRight size={14} />
            </Link>
        </div>
    );
};

// ============================================================================
// Waiting List Card
// ============================================================================
interface WaitingListCardProps {
    entries: WaitingListEntry[];
    onCancel: (id: string) => void;
}

export const WaitingListCard: React.FC<WaitingListCardProps> = ({ entries, onCancel }) => {
    if (entries.length === 0) return null;

    return (
        <div className="premium-card p-4 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-500">
                    <List size={16} />
                </div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Waiting List</span>
                <span className="badge bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 ml-auto">{entries.length}</span>
            </div>
            <div className="space-y-2">
                {entries.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">
                                {entry.preferredDate ? new Date(entry.preferredDate).toLocaleDateString() : 'Any Date'}
                                {entry.preferredTimeSlot && ` · ${entry.preferredTimeSlot}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
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
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"
                            title="Cancel Request"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <Link to="/client/waitlist" className="text-sm text-orange-600 font-medium mt-3 inline-flex items-center gap-1 hover:gap-2 transition-all">
                View All Requests <ChevronRight size={14} />
            </Link>
        </div>
    );
};

// ============================================================================
// Quick Actions - Premium Grid
// ============================================================================
interface QuickActionsProps {
    showSchedule?: boolean;
    showProgress?: boolean;
}

export const QuickActionsCard: React.FC<QuickActionsProps> = ({ showSchedule = true, showProgress = true }) => {
    if (!showSchedule && !showProgress) return null;

    return (
        <div className={`grid ${showSchedule && showProgress ? 'grid-cols-2' : 'grid-cols-1'} gap-3 animate-fade-in-up stagger-3`}>
            {showSchedule && (
                <Link to="/client/schedule" className="premium-card p-4 flex flex-col items-center text-center group hover:border-blue-200 dark:hover:border-blue-900">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                        <Calendar size={22} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Schedule</span>
                </Link>
            )}
            {showProgress && (
                <Link to="/client/progress" className="premium-card p-4 flex flex-col items-center text-center group hover:border-green-200 dark:hover:border-green-900">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/30">
                        <TrendingUp size={22} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                </Link>
            )}
        </div>
    );
};



// ============================================================================
// Floating Action Button for Quick Booking
// ============================================================================
export const FloatingBookButton: React.FC = () => (
    <Link to="/client/book" className="fab" aria-label="Book session">
        <Plus size={24} />
    </Link>
);

