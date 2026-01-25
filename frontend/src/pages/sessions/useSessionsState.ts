import { useState, useEffect, useMemo, useCallback } from 'react';
import { sessionsService, type Session } from '../../services/sessions.service';
import { clientsService, type Client } from '../../services/clients.service';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { roomsService, type Room } from '../../services/rooms.service';
import { devicesService, type Device } from '../../services/devices.service';

export interface SessionFormData {
    studioId: string;
    roomId: string;
    emsDeviceId: string;
    clientId: string;
    coachId: string;
    startTime: string;
    duration: number;
    notes: string;
    intensityLevel: number;
    recurrencePattern: '' | 'weekly' | 'biweekly' | 'monthly';
    recurrenceEndDate: string;
    recurrenceDays: number[];
    type: 'individual' | 'group';
    capacity: number;
}

export interface SessionFilters {
    status: string;
    coachId: string;
    studioId: string;
    dateFrom: string;
    dateTo: string;
}

const initialFormState: SessionFormData = {
    studioId: '',
    roomId: '',
    emsDeviceId: '',
    clientId: '',
    coachId: '',
    startTime: '',
    duration: 20,
    notes: '',
    intensityLevel: 5,
    recurrencePattern: '',
    recurrenceEndDate: '',
    recurrenceDays: [],
    type: 'individual',
    capacity: 1
};

const initialFilters: SessionFilters = {
    status: 'all',
    coachId: 'all',
    studioId: 'all',
    dateFrom: '',
    dateTo: ''
};

export function useSessionsState() {
    // Data state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    // Status change state
    const [statusAction, setStatusAction] = useState<'completed' | 'no_show' | 'cancelled' | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [deductSessionChoice, setDeductSessionChoice] = useState<boolean | null>(null);
    const [showDeductChoice, setShowDeductChoice] = useState(false);

    // Form state
    const [formData, setFormData] = useState<SessionFormData>(initialFormState);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<SessionFilters>(initialFilters);

    // Fetch all data
    const fetchData = useCallback(async () => {
        console.log('fetchData called, fetching sessions...');
        try {
            const [sessionsData, clientsData, coachesData, studiosData] = await Promise.all([
                sessionsService.getAll(),
                clientsService.getAll(),
                coachesService.getAll(),
                studiosService.getAll()
            ]);
            console.log('Received sessions data:', sessionsData.length, 'sessions');

            setSessions([]);
            setTimeout(() => {
                setSessions([...sessionsData]);
                setRefreshKey(prev => prev + 1);
            }, 0);

            setClients(clientsData);
            setCoaches(coachesData);
            setStudios(studiosData);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch rooms and devices when studio changes
    useEffect(() => {
        if (formData.studioId) {
            Promise.all([
                roomsService.getByStudio(formData.studioId),
                devicesService.getAvailableByStudio(formData.studioId)
            ]).then(([roomsData, devicesData]) => {
                setRooms(roomsData);
                setDevices(devicesData);
            }).catch(console.error);
        } else {
            setRooms([]);
            setDevices([]);
        }
    }, [formData.studioId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filtered sessions
    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const client = clients.find(c => c.id === session.clientId);
                const coach = coaches.find(c => c.id === session.coachId);
                const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
                const coachName = coach ? `${coach.firstName} ${coach.lastName}`.toLowerCase() : '';
                if (!clientName.includes(query) && !coachName.includes(query)) return false;
            }
            if (filters.status !== 'all' && session.status !== filters.status) return false;
            if (filters.coachId !== 'all' && session.coachId !== filters.coachId) return false;
            if (filters.studioId !== 'all' && session.studioId !== filters.studioId) return false;
            if (filters.dateFrom || filters.dateTo) {
                const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
                if (filters.dateFrom && sessionDate < filters.dateFrom) return false;
                if (filters.dateTo && sessionDate > filters.dateTo) return false;
            }
            return true;
        });
    }, [sessions, clients, coaches, searchQuery, filters]);

    // Handlers
    const resetForm = useCallback(() => {
        setFormData(initialFormState);
        setError(null);
    }, []);

    const handleFilterChange = useCallback((key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearchQuery('');
        setFilters(initialFilters);
    }, []);

    const handleCreate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const start = new Date(formData.startTime);
            const end = new Date(start.getTime() + formData.duration * 60000);

            await sessionsService.create({
                studioId: formData.studioId,
                roomId: formData.roomId,
                clientId: formData.clientId || undefined,
                coachId: formData.coachId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                emsDeviceId: formData.emsDeviceId || undefined,
                notes: formData.notes || undefined,
                recurrencePattern: formData.recurrencePattern || undefined,
                recurrenceEndDate: formData.recurrenceEndDate || undefined,
                recurrenceDays: formData.recurrenceDays.length > 0 ? formData.recurrenceDays : undefined,
                type: formData.type,
                capacity: formData.capacity
            });

            setIsCreateModalOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            if (err.conflicts && Array.isArray(err.conflicts)) {
                const conflictMessages = err.conflicts.map((c: { message: string }) => c.message).join('. ');
                setError(`Scheduling conflicts: ${conflictMessages}`);
            } else {
                setError(err.message || 'Failed to create session');
            }
        } finally {
            setSaving(false);
        }
    }, [formData, resetForm, fetchData]);

    const handleEdit = useCallback((session: Session) => {
        setSelectedSession(session);
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
        const formattedStartTime = new Date(session.startTime).toISOString().slice(0, 16);

        setFormData({
            studioId: session.studioId,
            roomId: session.roomId,
            emsDeviceId: (session as any).emsDeviceId || '',
            clientId: session.clientId,
            coachId: session.coachId,
            startTime: formattedStartTime,
            duration: duration,
            notes: session.notes || '',
            intensityLevel: session.intensityLevel || 5,
            recurrencePattern: '',
            recurrenceEndDate: '',
            recurrenceDays: [],
            type: session.type || 'individual',
            capacity: session.capacity || 1
        });
        setIsEditModalOpen(true);
    }, []);

    const handleUpdate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession) return;
        setError(null);
        setSaving(true);
        try {
            const start = new Date(formData.startTime);
            const end = new Date(start.getTime() + formData.duration * 60000);

            await sessionsService.update(selectedSession.id, {
                studioId: formData.studioId,
                roomId: formData.roomId,
                clientId: formData.clientId || undefined,
                coachId: formData.coachId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                emsDeviceId: formData.emsDeviceId || undefined,
                notes: formData.notes || undefined
            });

            setIsEditModalOpen(false);
            setSelectedSession(null);
            resetForm();
            fetchData();
        } catch (err: any) {
            if (err.conflicts && Array.isArray(err.conflicts)) {
                const conflictMessages = err.conflicts.map((c: { message: string }) => c.message).join('. ');
                setError(`Scheduling conflicts: ${conflictMessages}`);
            } else {
                setError(err.message || 'Failed to update session');
            }
        } finally {
            setSaving(false);
        }
    }, [formData, selectedSession, resetForm, fetchData]);

    const handleDeleteClick = useCallback((session: Session) => {
        setSelectedSession(session);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedSession) return;
        setSaving(true);
        try {
            await sessionsService.delete(selectedSession.id);
            setIsDeleteDialogOpen(false);
            setSelectedSession(null);
            fetchData();
        } catch (err) {
            console.error('Failed to delete session', err);
        } finally {
            setSaving(false);
        }
    }, [selectedSession, fetchData]);

    const handleStatusClick = useCallback((session: Session, action: 'completed' | 'no_show' | 'cancelled') => {
        setSelectedSession(session);
        setStatusAction(action);

        if (action === 'cancelled') {
            const sessionStart = new Date(session.startTime);
            const now = new Date();
            const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilSession < 48) {
                setShowDeductChoice(true);
                setDeductSessionChoice(true);
            } else {
                setShowDeductChoice(false);
                setDeductSessionChoice(false);
            }
        } else {
            setShowDeductChoice(false);
            setDeductSessionChoice(null);
        }

        setIsStatusModalOpen(true);
    }, []);

    const handleStatusConfirm = useCallback(async () => {
        if (!selectedSession || !statusAction) return;
        setSaving(true);
        setError(null);
        try {
            let deductSession: boolean | undefined;
            if (statusAction === 'cancelled') {
                deductSession = deductSessionChoice ?? false;
            }

            await sessionsService.updateStatus(
                selectedSession.id,
                statusAction,
                statusAction === 'cancelled' ? cancelReason : undefined,
                deductSession
            );

            await fetchData();

            setIsStatusModalOpen(false);
            setSelectedSession(null);
            setStatusAction(null);
            setCancelReason('');
            setDeductSessionChoice(null);
            setShowDeductChoice(false);
        } catch (err: any) {
            console.error('Failed to update status', err);
            setError(err.message || 'Failed to update session status');
        } finally {
            setSaving(false);
        }
    }, [selectedSession, statusAction, cancelReason, deductSessionChoice, fetchData]);

    const closeStatusModal = useCallback(() => {
        setIsStatusModalOpen(false);
        setStatusAction(null);
        setCancelReason('');
    }, []);

    return {
        // Data
        sessions,
        filteredSessions,
        clients,
        coaches,
        studios,
        rooms,
        devices,

        // UI state
        loading,
        saving,
        error,
        refreshKey,

        // Modal state
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        isStatusModalOpen,
        selectedSession,
        setSelectedSession,

        // Status change state
        statusAction,
        cancelReason,
        setCancelReason,
        deductSessionChoice,
        setDeductSessionChoice,
        showDeductChoice,

        // Form
        formData,
        setFormData,
        resetForm,

        // Filters
        searchQuery,
        setSearchQuery,
        filters,
        handleFilterChange,
        handleClearFilters,

        // Handlers
        handleCreate,
        handleEdit,
        handleUpdate,
        handleDeleteClick,
        handleDeleteConfirm,
        handleStatusClick,
        handleStatusConfirm,
        closeStatusModal,
        refresh: fetchData
    };
}
