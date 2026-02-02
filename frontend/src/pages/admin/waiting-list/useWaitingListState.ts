import { useState, useEffect, useCallback, useMemo } from 'react';
import { waitingListService, type WaitingListEntry, type CreateWaitingListEntryDto } from '../../../services/waiting-list.service';
import { clientsService, type Client } from '../../../services/clients.service';
import { studiosService, type Studio } from '../../../services/studios.service';
import { sessionsService } from '../../../services/sessions.service';
import { coachesService, type CoachDisplay } from '../../../services/coaches.service';
import { roomsService, type Room } from '../../../services/rooms.service';

export interface BookingData {
    startTime: string;
    endTime: string;
    coachId: string;
    roomId: string;
    programType: string;
    recurrencePattern?: 'weekly' | 'biweekly' | 'monthly';
    recurrenceEndDate?: string;
    recurrenceDays?: number[];
}

const initialFormData: CreateWaitingListEntryDto = {
    clientId: '',
    studioId: '',
    preferredDate: '',
    preferredTimeSlot: '',
    notes: '',
    requiresApproval: true
};

export function useWaitingListState() {
    // Data state
    const [entries, setEntries] = useState<WaitingListEntry[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [availableCoaches, setAvailableCoaches] = useState<CoachDisplay[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'queue' | 'all'>('pending');

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState<CreateWaitingListEntryDto>(initialFormData);

    // Book Session Modal State
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);
    const [bookingData, setBookingData] = useState<BookingData>({
        startTime: '',
        endTime: '',
        coachId: '',
        roomId: '',
        programType: 'Personal Training'
    });
    const [bookingLoading, setBookingLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [clientsData, studiosData, coachesData, roomsData] = await Promise.all([
                clientsService.getAll(),
                studiosService.getAll(),
                coachesService.getAll(),
                roomsService.getAll()
            ]);
            setClients(clientsData);
            setStudios(studiosData);
            setCoaches(coachesData);
            setRooms(roomsData);

            if (studiosData.length > 0) {
                setFormData(prev => ({ ...prev, studioId: studiosData[0].id }));
            }
        } catch (error) {
            console.error('Error fetching dependencies:', error);
        }
    }, []);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await waitingListService.getAll();
            setEntries(data);
        } catch (error) {
            console.error('Error fetching waiting list:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEntries();
        fetchData();
    }, [fetchEntries, fetchData]);

    // Filtered entries based on active tab
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            if (activeTab === 'pending') return entry.status === 'pending';
            if (activeTab === 'queue') return entry.status === 'approved' || entry.status === 'notified';
            return true;
        });
    }, [entries, activeTab]);

    // Handlers
    const handleCreate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await waitingListService.create(formData);
            setIsAddModalOpen(false);
            setFormData({
                ...initialFormData,
                studioId: studios[0]?.id || ''
            });
            fetchEntries();
        } catch (error) {
            console.error('Error creating entry:', error);
            alert('Failed to create entry');
        }
    }, [formData, studios, fetchEntries]);

    const handleApprove = useCallback(async (id: string) => {
        try {
            await waitingListService.approve(id);
            fetchEntries();
        } catch (error) {
            console.error('Error approving entry:', error);
        }
    }, [fetchEntries]);

    const handleReject = useCallback(async (id: string) => {
        if (!window.confirm('Are you sure you want to reject/cancel this request?')) return;
        try {
            await waitingListService.reject(id);
            fetchEntries();
        } catch (error) {
            console.error('Error rejecting entry:', error);
        }
    }, [fetchEntries]);

    const handlePriorityChange = useCallback(async (id: string, currentPriority: number, direction: 'up' | 'down') => {
        const newPriority = direction === 'up' ? currentPriority - 1 : currentPriority + 1;
        try {
            await waitingListService.updatePriority(id, newPriority);
            fetchEntries();
        } catch (error) {
            console.error('Error updating priority:', error);
        }
    }, [fetchEntries]);

    const handleNotify = useCallback(async (id: string) => {
        try {
            await waitingListService.notify(id);
            fetchEntries();
            alert('Client notified successfully!');
        } catch (error) {
            console.error('Error notifying client:', error);
            alert('Failed to notify client');
        }
    }, [fetchEntries]);

    const handleDelete = useCallback(async (id: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this entry?')) return;
        try {
            await waitingListService.delete(id);
            fetchEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    }, [fetchEntries]);

    // const [availableCoaches, setAvailableCoaches] = useState<any[]>([]); // Removed duplicate

    const openBookModal = useCallback((entry: WaitingListEntry) => {
        setSelectedEntry(entry);
        const preferredDate = entry.preferredDate
            ? new Date(entry.preferredDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        // Parse preferred time slot
        let startTime = '09:00';
        let endTime = '10:00';

        if (entry.preferredTimeSlot) {
            // Handle "HH:MM" or "HH:MM-HH:MM" formats
            const parts = entry.preferredTimeSlot.split('-');
            if (parts.length >= 1) {
                startTime = parts[0].trim();
                // Default duration 1 hour if no end time specified
                if (parts.length >= 2) {
                    endTime = parts[1].trim();
                } else {
                    const [hours, minutes] = startTime.split(':').map(Number);
                    if (!isNaN(hours)) {
                        const endHour = (hours + 1) % 24;
                        endTime = `${endHour.toString().padStart(2, '0')}:${minutes ? minutes.toString().padStart(2, '0') : '00'}`;
                    }
                }
            }
        }

        // Filter coaches by Studio and Gender preference
        const clientGender = entry.client?.user?.gender || 'pnts'; // pnts = prefer not to say

        const filteredCoaches = coaches.filter(coach => {
            // 1. Must match studio
            if (coach.studioId !== entry.studioId) return false;

            // 2. Check coach's gender preference
            if (coach.preferredClientGender === 'any') return true;
            if (coach.preferredClientGender === clientGender) return true;

            // If coach has specific preference and client doesn't match (or is unknown/pnts), exclude?
            // Strict filtering: exclude. Loose filtering: include if client is pnts? 
            // Let's go with strict for now if gender is known.
            if (clientGender === 'pnts') return true; // Show all if client gender is unknown

            return false;
        });

        setAvailableCoaches(filteredCoaches);

        setBookingData({
            startTime: `${preferredDate}T${startTime}`,
            endTime: `${preferredDate}T${endTime}`,
            coachId: filteredCoaches[0]?.id || '',
            roomId: rooms[0]?.id || '',
            programType: 'Personal Training'
        });
        setIsBookModalOpen(true);
    }, [coaches, rooms]);

    const handleBookSession = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEntry) return;

        setBookingLoading(true);
        try {
            await sessionsService.create({
                clientId: selectedEntry.clientId,
                studioId: selectedEntry.studioId,
                coachId: bookingData.coachId,
                roomId: bookingData.roomId,
                startTime: new Date(bookingData.startTime).toISOString(),
                endTime: new Date(bookingData.endTime).toISOString(),
                programType: bookingData.programType,
                recurrencePattern: bookingData.recurrencePattern,
                recurrenceEndDate: bookingData.recurrenceEndDate,
                recurrenceDays: bookingData.recurrenceDays,
                type: 'individual',
                capacity: 1
            });

            await waitingListService.markAsBooked(selectedEntry.id);

            setIsBookModalOpen(false);
            setSelectedEntry(null);
            fetchEntries();
            alert('Session booked successfully!');
        } catch (error: any) {
            console.error('Error booking session:', error);
            alert(error.message || 'Failed to book session');
        } finally {
            setBookingLoading(false);
        }
    }, [selectedEntry, bookingData, fetchEntries]);

    return {
        // Data
        entries,
        filteredEntries,
        clients,
        studios,
        coaches,
        availableCoaches, // Return filtered coaches
        rooms,

        // UI state
        loading,
        activeTab,
        setActiveTab,

        // Add modal
        isAddModalOpen,
        setIsAddModalOpen,
        formData,
        setFormData,

        // Book modal
        isBookModalOpen,
        setIsBookModalOpen,
        selectedEntry,
        bookingData,
        setBookingData,
        bookingLoading,

        // Handlers
        handleCreate,
        handleApprove,
        handleReject,
        handlePriorityChange,
        handleNotify,
        handleDelete,
        openBookModal,
        handleBookSession
    };
}
