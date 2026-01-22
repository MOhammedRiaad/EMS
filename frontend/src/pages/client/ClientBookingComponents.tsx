import React from 'react';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, User, Sparkles, Heart } from 'lucide-react';
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
    onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
}

export const CoachList: React.FC<CoachListProps> = ({ coaches, selectedCoachId, onSelect, onToggleFavorite }) => (
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
            <div key={coach.id} className="relative group">
                <button
                    onClick={() => onSelect(coach.id)}
                    className={`
                        flex items-center p-3 rounded-xl border-2 transition-all text-left w-full group stagger-${index + 1} pr-10
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
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-sm truncate">{coach.name}</span>
                        {coach.isFavorite && (
                            <span className={`text-[10px] ${selectedCoachId === coach.id ? 'text-blue-100' : 'text-blue-500'} flex items-center gap-0.5`}>
                                <Heart size={10} fill="currentColor" /> Favorited
                            </span>
                        )}
                    </div>
                </button>
                {/* Favorite Button */}
                {onToggleFavorite && (
                    <button
                        onClick={(e) => onToggleFavorite(coach.id, e)}
                        className={`
                            absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all z-10
                            ${selectedCoachId === coach.id
                                ? 'text-white/70 hover:text-white hover:bg-white/20'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}
                        `}
                        title={coach.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Heart
                            size={18}
                            fill={coach.isFavorite ? "currentColor" : "none"}
                            className={coach.isFavorite && selectedCoachId !== coach.id ? "text-red-500" : ""}
                        />
                    </button>
                )}
            </div>
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
// RecurrenceSelector - Premium Segmented Control
// ============================================================================

export interface RecurrenceSelectorProps {
    value: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable' | null;
    onChange: (value: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable' | null) => void;
    disabled?: boolean;
    slots?: { dayOfWeek: number; startTime: string }[];
    onSlotsChange?: (slots: { dayOfWeek: number; startTime: string }[]) => void;
}

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({ value, onChange, disabled, slots = [], onSlotsChange }) => {
    const options = [
        { label: 'One-time', value: null },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Bi-Weekly', value: 'biweekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Custom', value: 'variable' },
    ] as const;

    const [newDay, setNewDay] = React.useState(1);
    const [newTime, setNewTime] = React.useState('10:00');

    const handleAddSlot = () => {
        if (onSlotsChange) {
            onSlotsChange([...slots, { dayOfWeek: newDay, startTime: newTime }]);
        }
    };

    const handleRemoveSlot = (index: number) => {
        if (onSlotsChange) {
            onSlotsChange(slots.filter((_, i) => i !== index));
        }
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="flex flex-col space-y-2 mb-4 animate-fade-in-up">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Repeat Session</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {options.map((option) => (
                    <button
                        key={option.label}
                        onClick={() => onChange(option.value)}
                        disabled={disabled}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border
                            ${value === option.value
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-purple-300'}
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                        `}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            {value && value !== 'variable' && (
                <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-xs text-purple-700 dark:text-purple-300">
                    <Sparkles size={14} className="mt-0.5" />
                    <p>
                        Recurring sessions will be booked for the same time slot automatically.
                        {value === 'daily' && ' Every day for the next year.'}
                        {value === 'weekly' && ' Same day every week.'}
                        {value === 'biweekly' && ' Same day every two weeks.'}
                        {value === 'monthly' && ' Same day every month.'}
                    </p>
                </div>
            )}
            {value === 'variable' && (
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Custom Schedule</h4>
                    <div className="flex gap-2 mb-3">
                        <select
                            value={newDay}
                            onChange={(e) => setNewDay(Number(e.target.value))}
                            className="p-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-600 text-sm"
                        >
                            {days.map((d, i) => <option key={d} value={i}>{d}</option>)}
                        </select>
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="p-2 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-600 text-sm"
                        />
                        <button
                            onClick={handleAddSlot}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                        >
                            Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {slots.map((slot, index) => (
                            <div key={index} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border dark:border-slate-700 text-sm">
                                <span>{days[slot.dayOfWeek]} at {slot.startTime}</span>
                                <button onClick={() => handleRemoveSlot(index)} className="text-red-500 hover:bg-red-50 rounded p-1">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// BookingSummary - Premium Bottom Sheet
// ============================================================================

export interface BookingSummaryProps {
    selectedDate: Date;
    selectedSlot: string | null;
    slotStatus: 'available' | 'full' | undefined;
    booking: boolean;
    onAction: () => void;
    canBook?: boolean; // New optional prop
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ selectedDate, selectedSlot, slotStatus, booking, onAction, canBook }) => {
    // If canBook is provided, use it. Otherwise default to selectedSlot check.
    const isBookable = canBook !== undefined ? canBook : !!selectedSlot;

    return (
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
                    // If not selectedSlot but isBookable (variable recurrence), show custom message?
                    isBookable ? (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                                Custom Schedule
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                Variable Recurrence
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Select a time slot</p>
                    )
                )}
            </div>
            <button
                disabled={!isBookable || booking}
                onClick={onAction}
                className={`
                px-8 py-3 rounded-xl font-bold text-white transition-all active:scale-95
                ${!isBookable || booking
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
};

// ============================================================================
// ConflictReviewModal - Premium Modal for Conflicts
// ============================================================================

export interface ConflictReviewModalProps {
    conflicts: Array<{ date: string, conflict: string }>;
    validSessionsCount: number;
    onCancel: () => void;
    onProceed: () => void;
}

export const ConflictReviewModal: React.FC<ConflictReviewModalProps> = ({ conflicts, validSessionsCount, onCancel, onProceed }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4 text-amber-500">
                        <AlertCircle size={32} />
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Scheduling Conflicts</h2>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                        Some recurring sessions cannot be booked due to conflicts.
                        We can book <strong>{validSessionsCount}</strong> sessions successfully.
                    </p>

                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
                        <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-2 tracking-wider">Conflicts ({conflicts.length})</h4>
                        <ul className="space-y-2">
                            {conflicts.map((c, i) => (
                                <li key={i} className="flex justify-between text-xs border-b border-amber-100 dark:border-amber-800/30 last:border-0 pb-1 last:pb-0">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {new Date(c.date).toLocaleDateString()}
                                    </span>
                                    <span className="text-amber-600 dark:text-amber-400 italic text-right max-w-[60%] truncate">
                                        {c.conflict}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onProceed}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                        >
                            Proceed Anyway
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

