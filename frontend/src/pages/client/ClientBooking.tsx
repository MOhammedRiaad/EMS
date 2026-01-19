import { ChevronLeft } from 'lucide-react';
import { useClientBookingState } from './useClientBookingState';
import { DateSelector, SlotsGrid, BookingSummary, CoachList } from './ClientBookingComponents';

const ClientBooking = () => {
    const state = useClientBookingState();

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
                    />
                </aside>

                <main className="space-y-6">
                    <DateSelector
                        selectedDate={state.selectedDate}
                        onPrev={() => state.handleDateChange(-1)}
                        onNext={() => state.handleDateChange(1)}
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
            />
        </div>
    );
};

export default ClientBooking;
