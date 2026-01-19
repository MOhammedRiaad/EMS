import React, { useEffect, useState, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterBar from '../../components/common/FilterBar';
import { sessionsService, type Session } from '../../services/sessions.service';
import { clientsService, type Client } from '../../services/clients.service';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { roomsService, type Room } from '../../services/rooms.service';
import { devicesService, type Device } from '../../services/devices.service';
import { User, Building2, DoorOpen, AlertCircle, Cpu } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

const Sessions: React.FC = () => {
    const { canEdit, canDelete } = usePermissions();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);

    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusAction, setStatusAction] = useState<'completed' | 'no_show' | 'cancelled' | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deductSessionChoice, setDeductSessionChoice] = useState<boolean | null>(null);
    const [showDeductChoice, setShowDeductChoice] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const initialFormState = {
        studioId: '',
        roomId: '',
        emsDeviceId: '',
        clientId: '',
        coachId: '',
        startTime: '',
        duration: 20,
        notes: '',
        intensityLevel: 5,
        recurrencePattern: '' as '' | 'weekly' | 'biweekly' | 'monthly',
        recurrenceEndDate: '',
        recurrenceDays: [] as number[]
    };

    const [formData, setFormData] = useState(initialFormState);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        coachId: 'all',
        studioId: 'all',
        dateFrom: '',
        dateTo: ''
    });

    const fetchData = async () => {
        console.log('fetchData called, fetching sessions...');
        try {
            const [sessionsData, clientsData, coachesData, studiosData] = await Promise.all([
                sessionsService.getAll(),
                clientsService.getAll(),
                coachesService.getAll(),
                studiosService.getAll()
            ]);
            console.log('Received sessions data:', sessionsData.length, 'sessions');
            // Log the session statuses to verify backend returns updated data
            console.log('Session statuses:', sessionsData.map(s => ({ id: s.id.substring(0, 8), status: s.status })));

            // Clear sessions first to force unmount, then set new data
            setSessions([]);

            // Use setTimeout to ensure the clear happens in a separate render cycle
            setTimeout(() => {
                setSessions([...sessionsData]);
                setRefreshKey(prev => prev + 1);
                console.log('State updated with new sessions after clear');
            }, 0);

            setClients(clientsData);
            setCoaches(coachesData);
            setStudios(studiosData);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

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
    }, []);

    // Debug: Log when sessions state changes
    useEffect(() => {
        console.log('Sessions state changed, count:', sessions.length);
    }, [sessions]);

    // Filtered sessions
    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const client = clients.find(c => c.id === session.clientId);
                const coach = coaches.find(c => c.id === session.coachId);
                const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
                const coachName = coach ? `${coach.firstName} ${coach.lastName}`.toLowerCase() : '';

                if (!clientName.includes(query) && !coachName.includes(query)) return false;
            }

            // Status filter
            if (filters.status !== 'all' && session.status !== filters.status) {
                return false;
            }

            // Coach filter
            if (filters.coachId !== 'all' && session.coachId !== filters.coachId) {
                return false;
            }

            // Studio filter
            if (filters.studioId !== 'all' && session.studioId !== filters.studioId) {
                return false;
            }

            // Date range filter
            if (filters.dateFrom || filters.dateTo) {
                const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
                if (filters.dateFrom && sessionDate < filters.dateFrom) return false;
                if (filters.dateTo && sessionDate > filters.dateTo) return false;
            }

            return true;
        });
    }, [sessions, clients, coaches, searchQuery, filters]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilters({ status: 'all', coachId: 'all', studioId: 'all', dateFrom: '', dateTo: '' });
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setError(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const start = new Date(formData.startTime);
            const end = new Date(start.getTime() + formData.duration * 60000);

            await sessionsService.create({
                studioId: formData.studioId,
                roomId: formData.roomId,
                clientId: formData.clientId,
                coachId: formData.coachId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                emsDeviceId: formData.emsDeviceId || undefined,
                notes: formData.notes || undefined,
                recurrencePattern: formData.recurrencePattern || undefined,
                recurrenceEndDate: formData.recurrenceEndDate || undefined,
                recurrenceDays: formData.recurrenceDays.length > 0 ? formData.recurrenceDays : undefined
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
    };

    const handleEdit = (session: Session) => {
        setSelectedSession(session);
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        // Format datetime-local string (YYYY-MM-DDTHH:mm)
        const formattedStartTime = new Date(session.startTime).toISOString().slice(0, 16);

        setFormData({
            studioId: session.studioId,
            roomId: session.roomId,
            emsDeviceId: (session as any).emsDeviceId || '', // Cast to any as interface update might be pending
            clientId: session.clientId,
            coachId: session.coachId,
            startTime: formattedStartTime,
            duration: duration,
            notes: session.notes || '',
            intensityLevel: session.intensityLevel || 5,
            recurrencePattern: '' as const,
            recurrenceEndDate: '',
            recurrenceDays: []
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
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
                clientId: formData.clientId,
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
    };

    const handleDeleteClick = (session: Session) => {
        setSelectedSession(session);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
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
    };

    const handleStatusClick = (session: Session, action: 'completed' | 'no_show' | 'cancelled') => {
        setSelectedSession(session);
        setStatusAction(action);

        if (action === 'cancelled') {
            // Check if cancellation is within 48 hours of session start
            const sessionStart = new Date(session.startTime);
            const now = new Date();
            const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilSession < 48) {
                // Within 48 hours - ask admin if they want to deduct session
                setShowDeductChoice(true);
                setDeductSessionChoice(true); // Default to deduct for late cancellations
            } else {
                // More than 48 hours - don't deduct by default
                setShowDeductChoice(false);
                setDeductSessionChoice(false);
            }
        } else {
            setShowDeductChoice(false);
            setDeductSessionChoice(null);
        }

        setIsStatusModalOpen(true);
    };

    const handleStatusConfirm = async () => {
        if (!selectedSession || !statusAction) return;
        setSaving(true);
        setError(null);
        try {
            console.log('Updating session status...', selectedSession.id, statusAction);

            // Determine deductSession value
            let deductSession: boolean | undefined;
            if (statusAction === 'cancelled') {
                deductSession = deductSessionChoice ?? false;
            }
            // no_show always deducts (handled by backend)
            // completed always deducts (handled by backend)

            await sessionsService.updateStatus(
                selectedSession.id,
                statusAction,
                statusAction === 'cancelled' ? cancelReason : undefined,
                deductSession
            );

            console.log('Session status updated, fetching fresh data...');

            // Refresh data first
            await fetchData();

            console.log('Data fetched, closing modal...');

            // Then close modal and reset state
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
    };

    const columns: Column<Session>[] = [
        {
            key: 'startTime',
            header: 'Time',
            render: (session) => {
                const date = new Date(session.startTime);
                return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{date.toLocaleDateString()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'client',
            header: 'Client',
            render: (session) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} color="var(--color-text-secondary)" />
                    <span>{session.client ? `${session.client.firstName} ${session.client.lastName}` : 'Unknown Client'}</span>
                </div>
            )
        },
        {
            key: 'coach',
            header: 'Coach',
            render: (session) => {
                const coachName = session.coach?.user
                    ? `${session.coach.user.firstName || ''} ${session.coach.user.lastName || ''}`
                    : 'Unassigned';
                return <span style={{ color: 'var(--color-text-secondary)' }}>{coachName}</span>;
            }
        },
        {
            key: 'room',
            header: 'Room',
            render: (session) => (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                    {session.room?.name || '-'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (session) => (
                <span style={{
                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                    backgroundColor: session.status === 'scheduled' ? 'rgba(59, 130, 246, 0.1)' :
                        session.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: session.status === 'scheduled' ? '#3b82f6' :
                        session.status === 'completed' ? '#10b981' : 'var(--color-text-muted)'
                }}>
                    {session.status}
                </span>
            )
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Session,
            header: 'Actions',
            render: (session: Session) => (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {session.status === 'scheduled' && canEdit && (
                        <>
                            <button onClick={() => handleStatusClick(session, 'completed')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: 'pointer' }}>Complete</button>
                            <button onClick={() => handleStatusClick(session, 'no_show')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}>No-Show</button>
                            <button onClick={() => handleStatusClick(session, 'cancelled')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}>Cancel</button>
                        </>
                    )}
                    <ActionButtons
                        showEdit={canEdit && session.status === 'scheduled'}
                        showDelete={canDelete}
                        onEdit={() => handleEdit(session)}
                        onDelete={() => handleDeleteClick(session)}
                    />
                </div>
            )
        }] : [])
    ];

    const inputStyle = {
        width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)', outline: 'none'
    };

    const renderForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)',
                    color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
                }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Studio Selection */}
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <Building2 size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Studio
                </label>
                <select
                    required
                    value={formData.studioId}
                    onChange={e => setFormData({ ...formData, studioId: e.target.value, roomId: '', emsDeviceId: '' })}
                    style={inputStyle}
                    disabled={isEdit}
                >
                    <option value="">Select a Studio</option>
                    {studios.filter(s => s.isActive).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Room and Device Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        <DoorOpen size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Room
                    </label>
                    <select
                        required
                        value={formData.roomId}
                        onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                        style={inputStyle}
                        disabled={!formData.studioId}
                    >
                        <option value="">{formData.studioId ? 'Select a Room' : 'Select Studio first'}</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        <Cpu size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> EMS Device (optional)
                    </label>
                    <select
                        value={formData.emsDeviceId}
                        onChange={e => setFormData({ ...formData, emsDeviceId: e.target.value })}
                        style={inputStyle}
                        disabled={!formData.studioId}
                    >
                        <option value="">{formData.studioId ? (devices.length > 0 ? 'Select a Device' : 'No devices available') : 'Select Studio first'}</option>
                        {devices.map(d => (
                            <option key={d.id} value={d.id}>{d.label} {d.model ? `(${d.model})` : ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Client and Coach Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Client</label>
                    <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} style={inputStyle}>
                        <option value="">Select a Client</option>
                        {clients.map(c => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Coach</label>
                    <select required value={formData.coachId} onChange={e => setFormData({ ...formData, coachId: e.target.value })} style={inputStyle}>
                        <option value="">Select a Coach</option>
                        {coaches.map(c => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
                    </select>
                </div>
            </div>

            {/* Date/Time and Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Date & Time</label>
                    <input type="datetime-local" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} style={inputStyle} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Duration (min)</label>
                    <input type="number" min="10" step="5" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} style={inputStyle} />
                </div>
            </div>

            {/* Intensity Level and Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Intensity  Level</label>
                    <select
                        value={formData.intensityLevel}
                        onChange={e => setFormData({ ...formData, intensityLevel: parseInt(e.target.value) })}
                        style={inputStyle}
                    >
                        <option value="1">1 - Very Light</option>
                        <option value="2">2 - Light</option>
                        <option value="3">3 - Light-Moderate</option>
                        <option value="4">4 - Moderate</option>
                        <option value="5">5 - Moderate-Hard</option>
                        <option value="6">6 - Hard</option>
                        <option value="7">7 - Hard-Very Hard</option>
                        <option value="8">8 - Very Hard</option>
                        <option value="9">9 - Extremely Hard</option>
                        <option value="10">10 - Maximum</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Notes (Optional)</label>
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} placeholder="Session notes..." />
                </div>
            </div>

            {/* Recurring Sessions - only in create mode */}
            {!isEdit && (
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={!!formData.recurrencePattern}
                            onChange={e => setFormData({
                                ...formData,
                                recurrencePattern: e.target.checked ? 'weekly' : '' as const,
                                recurrenceEndDate: e.target.checked ? formData.recurrenceEndDate : ''
                            })}
                        />
                        <span style={{ fontWeight: 500 }}>Make this a recurring session</span>
                    </label>

                    {formData.recurrencePattern && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Repeat</label>
                                    <select
                                        value={formData.recurrencePattern}
                                        onChange={e => setFormData({ ...formData, recurrencePattern: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}
                                        style={inputStyle}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Every 2 Weeks</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Until Date</label>
                                    <input
                                        type="date"
                                        value={formData.recurrenceEndDate}
                                        onChange={e => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                                        style={inputStyle}
                                        min={formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0]}
                                        required={!!formData.recurrencePattern}
                                    />
                                </div>
                            </div>
                            {formData.recurrencePattern !== 'monthly' && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        Days of Week (select multiple for 2+ sessions/week)
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                                            const isSelected = formData.recurrenceDays.includes(index);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const newDays = isSelected
                                                            ? formData.recurrenceDays.filter(d => d !== index)
                                                            : [...formData.recurrenceDays, index].sort((a, b) => a - b);
                                                        setFormData({ ...formData, recurrenceDays: newDays });
                                                    }}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                        backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                                        color: isSelected ? 'white' : 'var(--color-text-primary)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: isSelected ? 600 : 400
                                                    }}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
                                        Leave empty to use the same day as the first session
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving...' : isEdit ? 'Reschedule Session' : 'Schedule Session'}
                </button>
            </div>
        </form>
    );

    return (
        <div key={refreshKey}>
            <PageHeader title="Sessions" description="Manage training sessions" actionLabel="Schedule Session" onAction={() => setIsCreateModalOpen(true)} />

            <FilterBar
                searchPlaceholder="Search by client or coach name..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                dropdowns={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                            { value: 'no_show', label: 'No Show' }
                        ]
                    },
                    {
                        key: 'coachId',
                        label: 'Coach',
                        options: coaches.map(c => ({
                            value: c.id,
                            label: `${c.firstName} ${c.lastName}`
                        }))
                    },
                    {
                        key: 'studioId',
                        label: 'Studio',
                        options: studios.filter(s => s.isActive).map(s => ({
                            value: s.id,
                            label: s.name
                        }))
                    }
                ]}
                dateRange={{
                    fromKey: 'dateFrom',
                    toKey: 'dateTo',
                    label: 'Date Range'
                }}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearFilters}
            />

            <DataTable
                key={refreshKey}
                columns={columns}
                data={filteredSessions}
                isLoading={loading}
            />
            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetForm(); }} title="Schedule Session">{renderForm(handleCreate, false)}</Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Reschedule Session">{renderForm(handleUpdate, true)}</Modal>
            <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => { setIsDeleteDialogOpen(false); setSelectedSession(null); }} onConfirm={handleDeleteConfirm} title="Cancel Session" message="Are you sure you want to cancel this session? This action cannot be undone." confirmLabel="Cancel Session" isDestructive loading={saving} />

            {/* Status Change Modal */}
            <Modal isOpen={isStatusModalOpen} onClose={() => { setIsStatusModalOpen(false); setStatusAction(null); setCancelReason(''); }} title={`Mark as ${statusAction?.replace('_', ' ')}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p>Are you sure you want to mark this session as <strong>{statusAction?.replace('_', ' ')}</strong>?</p>
                    {statusAction === 'cancelled' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Cancellation Reason (Optional)</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                                placeholder="Reason for cancellation..."
                            />
                            {showDeductChoice && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid var(--color-warning)',
                                    borderRadius: 'var(--border-radius-md)'
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={deductSessionChoice ?? false}
                                            onChange={(e) => setDeductSessionChoice(e.target.checked)}
                                        />
                                        <span style={{ fontSize: '0.875rem' }}>
                                            <strong>Deduct session from package</strong><br />
                                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                                (Cancellation is within 48 hours of session time)
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { setIsStatusModalOpen(false); setStatusAction(null); setCancelReason(''); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button onClick={handleStatusConfirm} disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>
                            {saving ? 'Updating...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Sessions;
