import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { sessionsService } from '../../services/sessions.service';
import type { Session } from '../../services/sessions.service';
import { clientsService } from '../../services/clients.service';
import type { Client } from '../../services/clients.service';
import { coachesService } from '../../services/coaches.service';
import type { Coach } from '../../services/coaches.service';
import { User } from 'lucide-react';

const Sessions: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>([]);

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newSession, setNewSession] = useState({
        clientId: '',
        coachId: '',
        startTime: '', // datetime-local string
        duration: 20, // minutes
        notes: ''
    });

    const fetchData = async () => {
        try {
            const [sessionsData, clientsData, coachesData] = await Promise.all([
                sessionsService.getAll(),
                clientsService.getAll(),
                coachesService.getAll()
            ]);
            setSessions(sessionsData);
            setClients(clientsData);
            setCoaches(coachesData);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const start = new Date(newSession.startTime);
            const end = new Date(start.getTime() + newSession.duration * 60000);

            await sessionsService.create({
                clientId: newSession.clientId,
                coachId: newSession.coachId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                status: 'scheduled',
                notes: newSession.notes
            });

            setIsModalOpen(false);
            setNewSession({ clientId: '', coachId: '', startTime: '', duration: 20, notes: '' });
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Failed to create session', error);
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
            render: (session) => (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                    {session.coach ? `${session.coach.firstName} ${session.coach.lastName}` : 'Unassigned'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (session) => (
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
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
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none'
    };

    return (
        <div>
            <PageHeader
                title="Sessions"
                description="Schedule and manage training sessions"
                actionLabel="New Session"
                onAction={() => setIsModalOpen(true)}
            />

            <DataTable
                columns={columns}
                data={sessions}
                isLoading={loading}
                onRowClick={(session) => console.log(session)}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Session">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Client</label>
                        <select
                            required
                            value={newSession.clientId}
                            onChange={e => setNewSession({ ...newSession, clientId: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Select a Client</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Coach</label>
                        <select
                            required
                            value={newSession.coachId}
                            onChange={e => setNewSession({ ...newSession, coachId: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Select a Coach</option>
                            {coaches.map(c => (
                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Date & Time</label>
                            <input
                                type="datetime-local"
                                required
                                value={newSession.startTime}
                                onChange={e => setNewSession({ ...newSession, startTime: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Duration (min)</label>
                            <input
                                type="number"
                                min="10"
                                step="5"
                                value={newSession.duration}
                                onChange={e => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Notes</label>
                        <textarea
                            value={newSession.notes}
                            onChange={e => setNewSession({ ...newSession, notes: e.target.value })}
                            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)' }}>Schedule</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Sessions;
