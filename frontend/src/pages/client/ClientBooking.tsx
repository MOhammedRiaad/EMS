import { ChevronLeft } from 'lucide-react';
import { useClientBookingState } from './useClientBookingState';
import { DateSelector, SlotsGrid, BookingSummary } from './ClientBookingComponents';

const ClientBooking = () => {
    const state = useClientBookingState();

    return (
        <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto bg-gray-50 dark:bg-slate-950 min-h-screen">
            <header className="flex items-center space-x-4 mb-6">
                <button onClick={() => state.navigate(-1)} className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-gray-600 dark:text-gray-300">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Book Session</h1>
            </header>

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
