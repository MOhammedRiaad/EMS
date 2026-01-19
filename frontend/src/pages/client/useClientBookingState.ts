import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/client-portal.service';

export interface Slot {
    time: string;
    status: 'available' | 'full';
}

export function useClientBookingState() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load slots when date changes
    useEffect(() => {
        const loadSlots = async () => {
            setLoading(true);
            setError(null);
            setSlots([]);
            setSelectedSlot(null);

            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const availableSlots = await clientPortalService.getAvailableSlots(dateStr);
                setSlots(availableSlots);
            } catch (err: any) {
                console.error("Failed to load slots", err);
                setError('Could not load availability. Please try another date.');
            } finally {
                setLoading(false);
            }
        };

        loadSlots();
    }, [selectedDate]);

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

    const handleBook = useCallback(async () => {
        if (!selectedSlot) return;
        if (!confirm(`Confirm booking for ${selectedDate.toDateString()} at ${selectedSlot}?`)) return;

        setBooking(true);
        try {
            const [hours, mins] = selectedSlot.split(':').map(Number);
            const startTime = new Date(selectedDate);
            startTime.setHours(hours, mins, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 20);

            await clientPortalService.bookSession({
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            });

            alert('Session booked successfully!');
            navigate('/client/home');
        } catch (err: any) {
            alert(err.message || 'Booking failed');
        } finally {
            setBooking(false);
        }
    }, [selectedSlot, selectedDate, navigate]);

    const handleAction = useCallback(async () => {
        if (!selectedSlot) return;
        const status = getSelectedSlotStatus();

        if (status === 'full') {
            await handleWaitlist();
        } else {
            await handleBook();
        }
    }, [selectedSlot, getSelectedSlotStatus, handleWaitlist, handleBook]);

    return {
        // Navigation
        navigate,

        // Date state
        selectedDate,
        handleDateChange,

        // Slots
        slots,
        loading,
        error,
        selectedSlot,
        setSelectedSlot,

        // Booking
        booking,
        getSelectedSlotStatus,
        handleAction
    };
}
