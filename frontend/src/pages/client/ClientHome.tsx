import { useAuth } from '../../contexts/AuthContext';
import { useClientHomeState } from './useClientHomeState';
import {
    NotificationsSection,
    NextSessionCard,
    ActivePackageCard,
    WaitingListCard,
    QuickActionsCard,
    BookingPromoCard
} from './ClientHomeComponents';

const ClientHome = () => {
    const { user } = useAuth();
    const state = useClientHomeState();

    if (state.loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block">{state.error}</div>
            </div>
        );
    }

    const { nextSession, activePackage } = state.data || {};

    return (
        <div className="p-6 space-y-8 pb-24 max-w-lg mx-auto md:max-w-4xl">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {state.getGreeting()},<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            {user?.firstName || 'Client'}
                        </span>
                    </h1>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg border-2 border-white dark:border-slate-700 shadow-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            </header>

            {/* Notifications */}
            <NotificationsSection notifications={state.importantNotifications} />

            {/* Main Action Card (Next Session or Booking) */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Up Next</h2>
                </div>
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

            {/* Booking Teaser / Promo */}
            <BookingPromoCard />
        </div>
    );
};

export default ClientHome;
