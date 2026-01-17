import { useState, useEffect } from 'react';
import { clientPortalService } from '../../services/client-portal.service';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientBooking = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<{ time: string; status: 'available' | 'full' }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load slots when date changes
    useEffect(() => {
        const loadSlots = async () => {
            setLoading(true);
            setError(null);
            setSlots([]); // Reset slots
            setSelectedSlot(null); // Deselect on date change

            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const availableSlots = await clientPortalService.getAvailableSlots(dateStr);
                setSlots(availableSlots);
            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error("Failed to load slots", err);
                setError('Could not load availability. Please try another date.');
            } finally {
                setLoading(false);
            }
        };

        loadSlots();
    }, [selectedDate]);

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        // Don't allow past dates
        if (newDate < new Date(new Date().setHours(0, 0, 0, 0))) return;
        setSelectedDate(newDate);
    };

    const getSelectedSlotStatus = () => {
        return slots.find(s => s.time === selectedSlot)?.status;
    }

    const handleAction = async () => {
        if (!selectedSlot) return;
        const status = getSelectedSlotStatus();

        if (status === 'full') {
            await handleWaitlist();
        } else {
            await handleBook();
        }
    };

    const handleWaitlist = async () => {
        if (!confirm(`This slot is full. Join the waiting list for ${selectedSlot}?`)) return;

        setBooking(true);
        try {
            await clientPortalService.joinWaitingList({
                preferredDate: selectedDate.toISOString().split('T')[0],
                preferredTimeSlot: selectedSlot!,
                studioId: undefined, // Backend handles default
            });
            alert('Request submitted! You have been added to the waiting list.');
            setSelectedSlot(null);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(err.message || 'Failed to join waitlist');
        } finally {
            setBooking(false);
        }
    };

    const handleBook = async () => {
        if (!confirm(`Confirm booking for ${selectedDate.toDateString()} at ${selectedSlot}?`)) return;

        setBooking(true);
        try {
            // Construct start/end time
            const [hours, mins] = selectedSlot!.split(':').map(Number);
            const startTime = new Date(selectedDate);
            startTime.setHours(hours, mins, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 20); // 20 min session duration

            await clientPortalService.bookSession({
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            });

            alert('Session booked successfully!');
            navigate('/client/home');
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(err.message || 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto bg-gray-50 min-h-screen">
            <header className="flex items-center space-x-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-gray-600">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Book Session</h1>
            </header>

            {/* Date Selector */}
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                    <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-gray-50 rounded-full text-gray-500 disabled:opacity-30" disabled={selectedDate <= new Date()}>
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-gray-800">{selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}</h2>
                        <p className="text-sm text-gray-500">{selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </section>

            {/* Slots Grid */}
            <section>
                <div className="flex items-center space-x-2 mb-3">
                    <Clock size={16} className="text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Available Times</h3>
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
                    <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400">No slots available for this day.</p>
                        <button onClick={() => handleDateChange(1)} className="mt-2 text-blue-600 text-sm font-medium">Check next day</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {slots.map(slot => (
                            <button
                                key={slot.time}
                                onClick={() => setSelectedSlot(slot.time)}
                                className={`
                                    py-3 px-2 rounded-xl text-sm font-semibold transition-all border relative overflow-hidden
                                    ${selectedSlot === slot.time
                                        ? (slot.status === 'full'
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200'
                                            : 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 transform scale-105')
                                        : (slot.status === 'full'
                                            ? 'bg-gray-50 text-gray-400 border-gray-100 hover:border-orange-200 hover:text-orange-500'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50')}
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

            {/* Summary / Book Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-xl flex items-center justify-between pb-8 z-50">
                <div>
                    {selectedSlot ? (
                        <div>
                            <p className="text-xs text-gray-400 font-medium">
                                {getSelectedSlotStatus() === 'full' ? 'WAITLIST REQUEST' : 'SELECTED'}
                            </p>
                            <p className="text-lg font-bold text-gray-800">{selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}, {selectedSlot}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Select a time</p>
                    )}
                </div>
                <button
                    disabled={!selectedSlot || booking}
                    onClick={handleAction}
                    className={`
                        px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                        ${!selectedSlot || booking
                            ? 'bg-gray-300 cursor-not-allowed'
                            : (getSelectedSlotStatus() === 'full'
                                ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-300'
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-300')}
                    `}
                >
                    {booking
                        ? 'Processing...'
                        : (getSelectedSlotStatus() === 'full' ? 'Join Waitlist' : 'Confirm')}
                </button>
            </div>
        </div>
    );
};

export default ClientBooking;
