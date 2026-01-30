import { useAuth } from '../../contexts/AuthContext';
import { useClientHomeState } from './useClientHomeState';
import {
    NotificationsSection,
    NextSessionCard,
    ActivePackageCard,
    WaitingListCard,
    QuickActionsCard,
    FloatingBookButton
} from './ClientHomeComponents';
import { ActivityFeed } from '../../components/client/social/ActivityFeed';
import CalendarSyncWidget from '../../components/dashboard/CalendarSyncWidget';

const ClientHome = () => {
    const { user } = useAuth();
    const state = useClientHomeState();

    if (state.loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-200 dark:border-slate-700"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl inline-block">{state.error}</div>
            </div>
        );
    }

    const { nextSession, activePackage } = state.data || {};

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

            <div className="relative p-6 space-y-6 pb-32 max-w-lg mx-auto md:max-w-6xl">
                {/* Header */}
                <header className="flex justify-between items-center animate-fade-in-up">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{state.getGreeting()}</p>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            <span className="gradient-text">
                                {user?.firstName || 'Welcome'}
                            </span>
                        </h1>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Notifications */}
                        <NotificationsSection notifications={state.importantNotifications} />

                        {/* Main Action Card (Next Session or Booking) */}
                        <section>
                            <NextSessionCard nextSession={nextSession} />
                        </section>

                        {/* Active Plan & Stats */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ActivePackageCard activePackage={activePackage} />
                            <WaitingListCard
                                entries={state.waitingList}
                                onCancel={state.handleCancelWaitingList}
                            />
                            <QuickActionsCard />
                        </section>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        <CalendarSyncWidget />
                        <div className="sticky top-6">
                            <ActivityFeed />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <FloatingBookButton />
        </div>
    );
};

export default ClientHome;
