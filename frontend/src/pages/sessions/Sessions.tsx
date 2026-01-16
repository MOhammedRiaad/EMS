import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { sessionsService, type Session } from '../../services/sessions.service';
import { clientsService, type Client } from '../../services/clients.service';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { roomsService, type Room } from '../../services/rooms.service';
import { devicesService, type Device } from '../../services/devices.service';
import { User, Building2, DoorOpen, AlertCircle, Cpu } from 'lucide-react';

const Sessions: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newSession, setNewSession] = useState({
        studioId: '',
        roomId: '',
        emsDeviceId: '',
        clientId: '',
        coachId: '',
        startTime: '',
        duration: 20,
        notes: ''
    });

    const fetchData = async () => {
        try {
            const [sessionsData, clientsData, coachesData, studiosData] = await Promise.all([
                sessionsService.getAll(),
                clientsService.getAll(),
                coachesService.getAll(),
                studiosService.getAll()
            ]);
            setSessions(sessionsData);
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
        if (newSession.studioId) {
            Promise.all([
                roomsService.getByStudio(newSession.studioId),
                devicesService.getAvailableByStudio(newSession.studioId)
            ]).then(([roomsData, devicesData]) => {
                setRooms(roomsData);
                setDevices(devicesData);
            }).catch(console.error);
        } else {
            setRooms([]);
            setDevices([]);
        }
    }, [newSession.studioId]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCreating(true);
        try {
            const start = new Date(newSession.startTime);
            const end = new Date(start.getTime() + newSession.duration * 60000);

            await sessionsService.create({
                studioId: newSession.studioId,
                roomId: newSession.roomId,
                clientId: newSession.clientId,
                coachId: newSession.coachId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                emsDeviceId: newSession.emsDeviceId || undefined,
                notes: newSession.notes || undefined
            });

            setIsModalOpen(false);
            setNewSession({ studioId: '', roomId: '', emsDeviceId: '', clientId: '', coachId: '', startTime: '', duration: 20, notes: '' });
            fetchData();
        } catch (err: any) {
            // Check if error has conflict details
            if (err.conflicts && Array.isArray(err.conflicts)) {
                const conflictMessages = err.conflicts.map((c: { message: string }) => c.message).join('. ');
                setError(`Scheduling conflicts: ${conflictMessages}`);
            } else {
                setError(err.message || 'Failed to create session');
            }
        } finally {
            setCreating(false);
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
        }
    ];

    const inputStyle = {
        width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)', outline: 'none'
    };

    return (
        <div>
            <PageHeader
                title="Sessions"
                description="Schedule and manage training sessions"
                actionLabel="New Session"
                onAction={() => setIsModalOpen(true)}
            />

            <DataTable columns={columns} data={sessions} isLoading={loading} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Session">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                            value={newSession.studioId}
                            onChange={e => setNewSession({ ...newSession, studioId: e.target.value, roomId: '', emsDeviceId: '' })}
                            style={inputStyle}
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
                                value={newSession.roomId}
                                onChange={e => setNewSession({ ...newSession, roomId: e.target.value })}
                                style={inputStyle}
                                disabled={!newSession.studioId}
                            >
                                <option value="">{newSession.studioId ? 'Select a Room' : 'Select Studio first'}</option>
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
                                value={newSession.emsDeviceId}
                                onChange={e => setNewSession({ ...newSession, emsDeviceId: e.target.value })}
                                style={inputStyle}
                                disabled={!newSession.studioId}
                            >
                                <option value="">{newSession.studioId ? (devices.length > 0 ? 'Select a Device' : 'No devices available') : 'Select Studio first'}</option>
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
                            <select required value={newSession.clientId} onChange={e => setNewSession({ ...newSession, clientId: e.target.value })} style={inputStyle}>
                                <option value="">Select a Client</option>
                                {clients.map(c => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Coach</label>
                            <select required value={newSession.coachId} onChange={e => setNewSession({ ...newSession, coachId: e.target.value })} style={inputStyle}>
                                <option value="">Select a Coach</option>
                                {coaches.map(c => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
                            </select>
                        </div>
                    </div>

                    {/* Date/Time and Duration */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Date & Time</label>
                            <input type="datetime-local" required value={newSession.startTime} onChange={e => setNewSession({ ...newSession, startTime: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Duration (min)</label>
                            <input type="number" min="10" step="5" value={newSession.duration} onChange={e => setNewSession({ ...newSession, duration: parseInt(e.target.value) })} style={inputStyle} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Notes</label>
                        <textarea value={newSession.notes} onChange={e => setNewSession({ ...newSession, notes: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" disabled={creating} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: creating ? 0.6 : 1 }}>
                            {creating ? 'Scheduling...' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Sessions;
