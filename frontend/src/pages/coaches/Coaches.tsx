import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { Mail, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserOption {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
}

const Coaches: React.FC = () => {
    const { token } = useAuth();
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newCoach, setNewCoach] = useState({ userId: '', studioId: '', bio: '', specializations: '' });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const fetchData = async () => {
        try {
            const [coachesData, studiosData] = await Promise.all([
                coachesService.getAll(),
                studiosService.getAll()
            ]);
            setCoaches(coachesData);
            setStudios(studiosData);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch users with 'coach' role for selection
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter users that could be coaches (not already assigned)
                setUsers(data.filter((u: UserOption) => u.role === 'coach'));
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            fetchUsers();
        }
    }, [isModalOpen]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCreating(true);
        try {
            await coachesService.create({
                userId: newCoach.userId,
                studioId: newCoach.studioId,
                bio: newCoach.bio || undefined,
                specializations: newCoach.specializations ? newCoach.specializations.split(',').map(s => s.trim()) : undefined
            });
            setIsModalOpen(false);
            setNewCoach({ userId: '', studioId: '', bio: '', specializations: '' });
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to create coach');
        } finally {
            setCreating(false);
        }
    };

    const columns: Column<CoachDisplay>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (coach) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                        fontWeight: 600, fontSize: '0.75rem'
                    }}>
                        {(coach.firstName?.[0] || '') + (coach.lastName?.[0] || '')}
                    </div>
                    <div style={{ fontWeight: 500 }}>{coach.firstName} {coach.lastName}</div>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email',
            render: (coach) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Mail size={14} />
                    {coach.email || '-'}
                </div>
            )
        },
        {
            key: 'studio',
            header: 'Studio',
            render: (coach) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Building2 size={14} />
                    {coach.studioName || '-'}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (coach) => (
                <span style={{
                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                    backgroundColor: coach.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: coach.active ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}>
                    {coach.active ? 'Active' : 'Inactive'}
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
                title="Coaches"
                description="Manage your training staff"
                actionLabel="Add Coach"
                onAction={() => setIsModalOpen(true)}
            />

            <DataTable columns={columns} data={coaches} isLoading={loading} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Coach">
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

                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        To add a coach, first create a user with "Coach" role in User Management, then assign them here.
                    </p>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Select User</label>
                        <select
                            required
                            value={newCoach.userId}
                            onChange={e => setNewCoach({ ...newCoach, userId: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Choose a user...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.firstName} {u.lastName} ({u.email})
                                </option>
                            ))}
                        </select>
                        {users.length === 0 && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                No users with "Coach" role available. Create one in User Management first.
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Select Studio</label>
                        <select
                            required
                            value={newCoach.studioId}
                            onChange={e => setNewCoach({ ...newCoach, studioId: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Choose a studio...</option>
                            {studios.filter(s => s.isActive).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Bio (optional)</label>
                        <textarea
                            value={newCoach.bio}
                            onChange={e => setNewCoach({ ...newCoach, bio: e.target.value })}
                            style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                            placeholder="Coach bio..."
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Specializations (comma-separated)</label>
                        <input
                            type="text"
                            value={newCoach.specializations}
                            onChange={e => setNewCoach({ ...newCoach, specializations: e.target.value })}
                            style={inputStyle}
                            placeholder="e.g. EMS Training, Weight Loss, Muscle Building"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button
                            type="submit"
                            disabled={creating || users.length === 0}
                            style={{
                                padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)',
                                color: 'white', borderRadius: 'var(--border-radius-md)',
                                opacity: creating || users.length === 0 ? 0.6 : 1
                            }}
                        >
                            {creating ? 'Assigning...' : 'Assign Coach'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Coaches;
