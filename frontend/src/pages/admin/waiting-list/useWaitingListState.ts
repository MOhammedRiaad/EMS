import { useState, useEffect, useCallback, useMemo } from 'react';
import { waitingListService, type WaitingListEntry, type CreateWaitingListEntryDto } from '../../../services/waiting-list.service';
import { clientsService, type Client } from '../../../services/clients.service';
import { studiosService, type Studio } from '../../../services/studios.service';
import { sessionsService } from '../../../services/sessions.service';
import { coachesService } from '../../../services/coaches.service';
import { roomsService } from '../../../services/rooms.service';

export interface BookingData {
    startTime: string;
    endTime: string;
    coachId: string;
    roomId: string;
    programType: string;
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
    const [coaches, setCoaches] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

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

    const openBookModal = useCallback((entry: WaitingListEntry) => {
        setSelectedEntry(entry);
        const preferredDate = entry.preferredDate
            ? new Date(entry.preferredDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        setBookingData({
            startTime: `${preferredDate}T09:00`,
            endTime: `${preferredDate}T10:00`,
            coachId: coaches[0]?.id || '',
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
                programType: bookingData.programType
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
