import React from 'react';
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { Slot } from './useClientBookingState';

// ============================================================================
// DateSelector
// ============================================================================

export interface DateSelectorProps {
    selectedDate: Date;
    onPrev: () => void;
    onNext: () => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onPrev, onNext }) => (
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex justify-between items-center">
            <button onClick={onPrev} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400 disabled:opacity-30" disabled={selectedDate <= new Date()}>
                <ChevronLeft size={24} />
            </button>
            <div className="text-center">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
            </div>
            <button onClick={onNext} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
                <ChevronRight size={24} />
            </button>
        </div>
    </section>
);

// ============================================================================
// SlotsGrid
// ============================================================================

export interface SlotsGridProps {
    slots: Slot[];
    loading: boolean;
    error: string | null;
    selectedSlot: string | null;
    onSelectSlot: (time: string) => void;
    onNextDay: () => void;
}

export const SlotsGrid: React.FC<SlotsGridProps> = ({ slots, loading, error, selectedSlot, onSelectSlot, onNextDay }) => (
    <section>
        <div className="flex items-center space-x-2 mb-3">
            <Clock size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Available Times</h3>
        </div>

        {loading ? (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        ) : error ? (
            <div className="bg-red-50 p-4 rounded-xl text-red-500 text-center text-sm">
                <AlertCircle className="mx-auto mb-2" size={20} />
                {error}
            </div>
        ) : slots.length === 0 ? (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                <p className="text-gray-400 dark:text-gray-500">No slots available for this day.</p>
                <button onClick={onNextDay} className="mt-2 text-blue-600 dark:text-blue-400 text-sm font-medium">Check next day</button>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-3">
                {slots.map(slot => (
                    <button
                        key={slot.time}
                        onClick={() => onSelectSlot(slot.time)}
                        className={`
                            py-3 px-2 rounded-xl text-sm font-semibold transition-all border relative overflow-hidden
                            ${selectedSlot === slot.time
                                ? (slot.status === 'full'
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 dark:shadow-none'
                                    : 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 dark:shadow-none transform scale-105')
                                : (slot.status === 'full'
                                    ? 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-900 hover:text-orange-500 dark:hover:text-orange-400'
                                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20')}
                        `}
                    >
                        {slot.time}
                        {slot.status === 'full' && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400"></span>
                        )}
                    </button>
                ))}
            </div>
        )}
    </section>
);

// ============================================================================
// BookingSummary
// ============================================================================

export interface BookingSummaryProps {
    selectedDate: Date;
    selectedSlot: string | null;
    slotStatus: 'available' | 'full' | undefined;
    booking: boolean;
    onAction: () => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ selectedDate, selectedSlot, slotStatus, booking, onAction }) => (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-xl flex items-center justify-between pb-8 z-50">
        <div>
            {selectedSlot ? (
                <div>
                    <p className="text-xs text-gray-400 font-medium">
                        {slotStatus === 'full' ? 'WAITLIST REQUEST' : 'SELECTED'}
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}, {selectedSlot}</p>
                </div>
            ) : (
                <p className="text-gray-400 text-sm">Select a time</p>
            )}
        </div>
        <button
            disabled={!selectedSlot || booking}
            onClick={onAction}
            className={`
                px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                ${!selectedSlot || booking
                    ? 'bg-gray-300 cursor-not-allowed'
                    : (slotStatus === 'full'
                        ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-300'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-300')}
            `}
        >
            {booking
                ? 'Processing...'
                : (slotStatus === 'full' ? 'Join Waitlist' : 'Confirm')}
        </button>
    </div>
);
