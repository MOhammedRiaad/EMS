import { AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClientScheduleState } from './useClientScheduleState';
import {
    FilterTabs,
    SessionCard,
    EmptyState,
    ReviewModal,
    CalendarView,
    HistoryFilterControls
} from './ClientScheduleComponents';

const ClientSchedule = () => {
    const state = useClientScheduleState();

    if (state.loading && state.sessions.length === 0) {
        return <div className="p-6 text-center text-gray-500">Loading schedule...</div>;
    }

    return (
        <div className="p-4 space-y-4 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Schedule</h1>
                <Link to="/client/book" className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <Plus size={24} />
                </Link>
            </header>

            <FilterTabs filter={state.filter} setFilter={state.setFilter} />

            {state.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
                    <AlertCircle size={20} className="mr-2" />
                    {state.error}
                </div>
            )}

            <div className="space-y-4">
                {state.filter === 'upcoming' && (
                    <CalendarView
                        currentMonth={state.calendarMonth}
                        onMonthChange={state.handleCalendarMonthChange}
                        sessions={state.sessions}
                        selectedDate={state.selectedDate}
                        onSelectDate={state.setSelectedDate}
                    />
                )}

                {state.filter === 'past' && (
                    <HistoryFilterControls
                        filter={state.historyFilter}
                        setFilter={state.setHistoryFilter}
                    />
                )}

                <div className="space-y-3">
                    {state.filteredSessions.length === 0 ? (
                        <EmptyState filter={state.filter} />
                    ) : (
                        state.filteredSessions.map(session => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                filter={state.filter}
                                onCancel={state.handleCancel}
                                onReview={state.openReviewModal}
                            />
                        ))
                    )}
                </div>
            </div>

            {state.showReviewModal && (
                <ReviewModal
                    rating={state.reviewRating}
                    setRating={state.setReviewRating}
                    comment={state.reviewComment}
                    setComment={state.setReviewComment}
                    submitting={state.reviewSubmitting}
                    onSubmit={state.submitReview}
                    onClose={state.closeReviewModal}
                />
            )}
        </div>
    );
};

export default ClientSchedule;
