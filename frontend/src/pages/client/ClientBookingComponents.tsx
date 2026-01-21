import React from 'react';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, User, Sparkles } from 'lucide-react';
import type { Slot, BookingCoach } from './useClientBookingState';

// ============================================================================
// DateSelector - Premium Week Calendar Style
// ============================================================================

export interface DateSelectorProps {
    selectedDate: Date;
    onPrev: () => void;
    onNext: () => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onPrev, onNext }) => {
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    return (
        <section className="premium-card p-4 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <button
                    onClick={onPrev}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-400 transition-all active:scale-90 disabled:opacity-30"
                    disabled={selectedDate <= new Date()}
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    {isToday && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                            <Sparkles size={12} />
                            Today
                        </span>
                    )}
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                </div>
                <button
                    onClick={onNext}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-400 transition-all active:scale-90"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </section>
    );
};

// ============================================================================
// CoachList - Premium Coach Carousel
// ============================================================================

export interface CoachListProps {
    coaches: BookingCoach[];
    selectedCoachId: string | null;
    onSelect: (id: string | null) => void;
}

export const CoachList: React.FC<CoachListProps> = ({ coaches, selectedCoachId, onSelect }) => (
    <div className="flex flex-col space-y-3 animate-slide-in-left">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Select Coach</h3>

        {/* Any Coach Option */}
        <button
            onClick={() => onSelect(null)}
            className={`
                flex items-center p-3 rounded-xl border-2 transition-all w-full group
                ${!selectedCoachId
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-transparent shadow-lg shadow-purple-500/30'
                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'}
            `}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 transition-transform group-hover:scale-110 ${!selectedCoachId ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-800'}`}>
                <User size={18} />
            </div>
            <div className="text-left">
                <span className="font-semibold text-sm block">Any Coach</span>
                <span className={`text-xs ${!selectedCoachId ? 'text-purple-200' : 'text-gray-400'}`}>Auto-assign</span>
            </div>
        </button>

        {/* Coach List */}
        {coaches.map((coach, index) => (
            <button
                key={coach.id}
                onClick={() => onSelect(coach.id)}
                className={`
                    flex items-center p-3 rounded-xl border-2 transition-all text-left w-full group stagger-${index + 1}
                    ${selectedCoachId === coach.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-lg shadow-blue-500/30'
                        : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'}
                `}
            >
                {coach.avatarUrl ? (
                    <img src={coach.avatarUrl} alt={coach.name} className="w-10 h-10 rounded-xl object-cover mr-3 border-2 border-white/20 shrink-0 group-hover:scale-110 transition-transform" />
                ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 transition-transform group-hover:scale-110 ${selectedCoachId === coach.id ? 'bg-white/20' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800'}`}>
                        <span className="text-sm font-bold">{coach.name.charAt(0)}</span>
                    </div>
                )}
                <span className="font-semibold text-sm truncate">{coach.name}</span>
            </button>
        ))}
    </div>
);

// ============================================================================
// SlotsGrid - Premium Time Slot Cards
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
    <section className="animate-fade-in-up stagger-2">
        <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Clock size={16} />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Times</h3>
            {slots.filter(s => s.status === 'available').length > 0 && (
                <span className="badge bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs ml-auto">
                    {slots.filter(s => s.status === 'available').length} available
                </span>
            )}
        </div>

        {loading ? (
            <div className="flex justify-center p-8">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full border-4 border-blue-200 dark:border-slate-700"></div>
                    <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                </div>
            </div>
        ) : error ? (
            <div className="premium-card p-6 text-center border-l-4 border-l-red-500">
                <AlertCircle className="mx-auto mb-2 text-red-500" size={24} />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
        ) : slots.length === 0 ? (
            <div className="text-center p-8 premium-card border-dashed">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    <Clock size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No slots available</p>
                <button onClick={onNextDay} className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">
                    Check next day →
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((slot, index) => (
                    <button
                        key={slot.time}
                        onClick={() => onSelectSlot(slot.time)}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className={`
                            py-4 px-3 rounded-xl text-sm font-semibold transition-all border-2 relative overflow-hidden
                            opacity-0 animate-fade-in-scale
                            ${selectedSlot === slot.time
                                ? (slot.status === 'full'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-lg shadow-orange-500/30 scale-105'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-lg shadow-blue-500/30 scale-105')
                                : (slot.status === 'full'
                                    ? 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-500'
                                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover-lift')}
                        `}
                    >
                        <span className="relative z-10">{slot.time}</span>
                        {slot.status === 'full' && (
                            <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded bg-orange-200 dark:bg-orange-800 text-orange-600 dark:text-orange-300">
                                Full
                            </span>
                        )}
                    </button>
                ))}
            </div>
        )}
    </section>
);

// ============================================================================
// BookingSummary - Premium Bottom Sheet
// ============================================================================

export interface BookingSummaryProps {
    selectedDate: Date;
    selectedSlot: string | null;
    slotStatus: 'available' | 'full' | undefined;
    booking: boolean;
    onAction: () => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ selectedDate, selectedSlot, slotStatus, booking, onAction }) => (
    <div className="fixed bottom-0 left-0 right-0 p-4 glass-card border-t border-gray-200 dark:border-slate-800 flex items-center justify-between pb-8 z-50 animate-fade-in-up">
        <div>
            {selectedSlot ? (
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                        {slotStatus === 'full' ? 'Waitlist Request' : 'Booking'}
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {selectedSlot}
                    </p>
                </div>
            ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm">Select a time slot</p>
            )}
        </div>
        <button
            disabled={!selectedSlot || booking}
            onClick={onAction}
            className={`
                px-8 py-3 rounded-xl font-bold text-white transition-all active:scale-95
                ${!selectedSlot || booking
                    ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'
                    : (slotStatus === 'full'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 hover:-translate-y-0.5'
                        : 'btn-gradient')}
            `}
        >
            {booking
                ? 'Processing...'
                : (slotStatus === 'full' ? 'Join Waitlist' : 'Confirm Booking')}
        </button>
    </div>
);

