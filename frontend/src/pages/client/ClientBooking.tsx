import { ChevronLeft, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useClientBookingState } from './useClientBookingState';
import { DateSelector, SlotsGrid, BookingSummary, CoachList, RecurrenceSelector, ConflictReviewModal } from './ClientBookingComponents';

const ClientBooking = () => {
    const { isEnabled } = useAuth();
    const state = useClientBookingState();

    if (!isEnabled('client.booking')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                    <Lock size={48} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Feature Not Available</h2>
                <p className="text-gray-500 max-w-md">Self-service booking is currently disabled for this studio.</p>
                <button
                    onClick={() => state.navigate(-1)}
                    className="mt-4 px-6 py-2 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 max-w-5xl mx-auto bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
            <header className="flex items-center space-x-4 mb-2">
                <button onClick={() => state.navigate(-1)} className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Book Session</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 mt-6 items-start">
                <aside className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 sticky top-4">
                    <CoachList
                        coaches={state.coaches}
                        selectedCoachId={state.selectedCoachId}
                        onSelect={state.setSelectedCoachId}
                        onToggleFavorite={state.handleToggleFavorite}
                    />
                </aside>

                <main className="space-y-6">
                    <DateSelector
                        selectedDate={state.selectedDate}
                        onPrev={() => state.handleDateChange(-1)}
                        onNext={() => state.handleDateChange(1)}
                    />

                    {/* Only show recurrence selector if a date is selected? Or always? */}
                    <RecurrenceSelector
                        value={state.recurrencePattern}
                        onChange={state.setRecurrencePattern}
                        slots={state.recurrenceSlots}
                        onSlotsChange={state.setRecurrenceSlots}
                    />

                    <SlotsGrid
                        slots={state.slots}
                        loading={state.loading}
                        error={state.error}
                        selectedSlot={state.selectedSlot}
                        onSelectSlot={state.setSelectedSlot}
                        onNextDay={() => state.handleDateChange(1)}
                    />
                </main>
            </div>

            <BookingSummary
                selectedDate={state.selectedDate}
                selectedSlot={state.selectedSlot}
                slotStatus={state.getSelectedSlotStatus()}
                booking={state.booking}
                onAction={state.handleAction}
                canBook={
                    !!state.selectedSlot ||
                    (state.recurrencePattern === 'variable' && state.recurrenceSlots.length > 0)
                }
            />

            {state.showConflictModal && state.validationResult && (
                <ConflictReviewModal
                    conflicts={state.validationResult.conflicts}
                    validSessionsCount={state.validationResult.validSessions.length}
                    onCancel={() => state.setShowConflictModal(false)}
                    onProceed={state.handleProceedWithConflicts}
                />
            )}
        </div>
    );
};

export default ClientBooking;
