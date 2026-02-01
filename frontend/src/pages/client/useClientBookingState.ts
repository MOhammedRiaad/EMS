import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/client-portal.service';

export interface Slot {
    time: string;
    status: 'available' | 'full';
}

export interface BookingCoach {
    id: string;
    name: string;
    avatarUrl: string | null;
    isFavorite?: boolean;
}

export function useClientBookingState() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<Slot[]>([]);
    const [coaches, setCoaches] = useState<BookingCoach[]>([]);
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable' | null>(null);
    const [recurrenceSlots, setRecurrenceSlots] = useState<{ dayOfWeek: number; startTime: string }[]>([]);
    const [validationResult, setValidationResult] = useState<{ validSessions: string[], conflicts: Array<{ date: string, conflict: string }> } | null>(null);
    const [showConflictModal, setShowConflictModal] = useState(false);

    // 1. Fetch Coaches and Favorites on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [coachesData, favoritesData] = await Promise.all([
                    clientPortalService.getCoaches(),
                    clientPortalService.getFavoriteCoaches()
                ]);

                const favoriteIds = new Set(favoritesData.map((f: any) => f.id));

                const formatted: BookingCoach[] = coachesData.map((c: any) => ({
                    id: c.id,
                    name: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Coach',
                    avatarUrl: c.user?.avatarUrl || null,
                    isFavorite: favoriteIds.has(c.id)
                }));

                // Sort favorites first
                formatted.sort((_a, _b) => {
                    if (_a.isFavorite && !_b.isFavorite) return -1;
                    if (!_a.isFavorite && _b.isFavorite) return 1;
                    return 0;
                });

                setCoaches(formatted);
            } catch (err) {
                console.error("Failed to load coaches data", err);
            }
        };
        loadData();
    }, []);

    const handleToggleFavorite = useCallback(async (coachId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selection
        try {
            const { favorited } = await clientPortalService.toggleFavoriteCoach(coachId);
            setCoaches(prev => prev.map(c =>
                c.id === coachId ? { ...c, isFavorite: favorited } : c
            ).sort((_a, _b) => {
                return 0; // Keep order for now
            }));
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    }, []);

    // 2. Load slots when date or coach changes
    useEffect(() => {
        const loadSlots = async () => {
            setLoading(true);
            setError(null);
            setSlots([]);
            setSelectedSlot(null);

            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const availableSlots = await clientPortalService.getAvailableSlots(dateStr, undefined, selectedCoachId || undefined);
                setSlots(availableSlots);
            } catch (err: any) {
                console.error("Failed to load slots", err);
                setError('Could not load availability. Please try another date.');
            } finally {
                setLoading(false);
            }
        };

        loadSlots();
    }, [selectedDate, selectedCoachId]);

    const handleDateChange = useCallback((days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        // Don't allow past dates
        if (newDate < new Date(new Date().setHours(0, 0, 0, 0))) return;
        setSelectedDate(newDate);
    }, [selectedDate]);

    const getSelectedSlotStatus = useCallback(() => {
        return slots.find(s => s.time === selectedSlot)?.status;
    }, [slots, selectedSlot]);

    const handleWaitlist = useCallback(async () => {
        if (!selectedSlot) return;
        if (!confirm(`This slot is full. Join the waiting list for ${selectedSlot}?`)) return;

        setBooking(true);
        try {
            await clientPortalService.joinWaitingList({
                preferredDate: selectedDate.toISOString().split('T')[0],
                preferredTimeSlot: selectedSlot,
                studioId: undefined,
            });
            alert('Request submitted! You have been added to the waiting list.');
            setSelectedSlot(null);
        } catch (err: any) {
            alert(err.message || 'Failed to join waitlist');
        } finally {
            setBooking(false);
        }
    }, [selectedSlot, selectedDate]);

    const handleBook = useCallback(async (ignoreConflicts = false) => {
        // Validation: Must have selectedSlot OR (variable + slots)
        if (!selectedSlot && !(recurrencePattern === 'variable' && recurrenceSlots.length > 0)) {
            return;
        }

        let effectiveSelectedSlot = selectedSlot;
        let effectiveDate = selectedDate;

        // Auto-calculate start time for variable if no slot selected
        if (!selectedSlot && recurrencePattern === 'variable' && recurrenceSlots.length > 0) {
            // Find the soonest slot from "now" or "selectedDate"?
            // Let's assume start from selectedDate (the week view user is on).
            // Actually, we should find the first slot in the list that is TODAY or FUTURE relative to selectedDate?
            // Simple approach: Use the first slot in the list on the NEAREST valid day >= selectedDate.

            // Sort slots by day/time?
            // recurrenceSlots are { dayOfWeek: 0-6, startTime: 'HH:MM' }
            // Let's pick the first one and find the date for it.
            const firstSlot = recurrenceSlots[0];
            const targetDay = firstSlot.dayOfWeek;

            // Find date matching targetDay starting from selectedDate
            const date = new Date(selectedDate);
            while (date.getDay() !== targetDay) {
                date.setDate(date.getDate() + 1);
            }
            effectiveDate = date;
            effectiveSelectedSlot = firstSlot.startTime;
        }

        if (!effectiveSelectedSlot) return; // Should not happen

        let shouldConfirm = false;
        if (!recurrencePattern) {
            shouldConfirm = confirm(`Confirm booking for ${effectiveDate.toDateString()} at ${effectiveSelectedSlot}?`);
        } else if (ignoreConflicts) {
            shouldConfirm = true;
        } else {
            let msg = `Confirm recurring booking (${recurrencePattern}) starting ${effectiveDate.toDateString()} at ${effectiveSelectedSlot}?`;
            if (recurrencePattern === 'variable') {
                msg = `Confirm variable recurring booking with ${recurrenceSlots.length} slots/week starting ${effectiveDate.toDateString()} at ${effectiveSelectedSlot}?`;
            }
            shouldConfirm = confirm(msg);
        }

        if (!shouldConfirm) return;

        setBooking(true);
        try {
            const [hours, mins] = effectiveSelectedSlot.split(':').map(Number);
            const startTime = new Date(effectiveDate);
            startTime.setHours(hours, mins, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 20);

            if (recurrencePattern && !ignoreConflicts) {
                const endDate = new Date(effectiveDate);
                endDate.setFullYear(endDate.getFullYear() + 1);

                const validation = await clientPortalService.validateRecurrence({
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    coachId: selectedCoachId || undefined,
                    studioId: undefined,
                    recurrencePattern,
                    recurrenceEndDate: endDate.toISOString().split('T')[0],
                    recurrenceSlots: recurrencePattern === 'variable' ? recurrenceSlots : undefined
                });

                if (validation.conflicts.length > 0) {
                    setValidationResult(validation);
                    setShowConflictModal(true);
                    setBooking(false);
                    return;
                }
            }

            const endDate = new Date(effectiveDate);
            endDate.setFullYear(endDate.getFullYear() + 1);

            await clientPortalService.bookSession({
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                coachId: selectedCoachId || undefined,
                recurrencePattern: recurrencePattern || undefined,
                recurrenceEndDate: recurrencePattern ? endDate.toISOString().split('T')[0] : undefined,
                recurrenceSlots: recurrencePattern === 'variable' ? recurrenceSlots : undefined
            });

            alert('Session(s) booked successfully!');
            navigate('/client/home');
        } catch (err: any) {
            alert(err.message || 'Booking failed');
            setBooking(false);
        }
    }, [selectedSlot, selectedDate, selectedCoachId, navigate, recurrencePattern, recurrenceSlots]);

    const handleAction = useCallback(async () => {
        // Check if we can proceed
        const canBookVariable = recurrencePattern === 'variable' && recurrenceSlots.length > 0;

        if (!selectedSlot && !canBookVariable) return;

        const status = selectedSlot ? getSelectedSlotStatus() : 'available'; // Default to available for variable auto-start

        if (status === 'full') {
            await handleWaitlist();
        } else {
            await handleBook(false);
        }
    }, [selectedSlot, getSelectedSlotStatus, handleWaitlist, handleBook, recurrencePattern, recurrenceSlots]);

    const handleProceedWithConflicts = useCallback(async () => {
        setShowConflictModal(false);
        await handleBook(true); // Ignore conflicts and book valid ones
    }, [handleBook]);

    return {
        navigate,
        selectedDate,
        handleDateChange,
        coaches,
        selectedCoachId,
        setSelectedCoachId,
        slots,
        loading,
        error,
        selectedSlot,
        setSelectedSlot,
        recurrencePattern,
        setRecurrencePattern,
        recurrenceSlots,
        setRecurrenceSlots,
        validationResult,
        showConflictModal,
        setShowConflictModal,
        handleProceedWithConflicts,
        booking,
        getSelectedSlotStatus,
        handleAction,
        handleToggleFavorite
    };
}
