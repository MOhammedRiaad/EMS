import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { Mail, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getImageUrl } from '../../utils/imageUtils';

interface UserOption { id: string; email: string; firstName: string | null; lastName: string | null; role: string; }

const Coaches: React.FC = () => {
    const { token } = useAuth();
    const { canEdit, canDelete } = usePermissions();
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<CoachDisplay | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const initialFormState = {
        userId: '',
        studioId: '',
        bio: '',
        specializations: '',
        availabilityRules: [
            { dayOfWeek: 'monday', available: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'tuesday', available: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'wednesday', available: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'thursday', available: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'friday', available: true, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'saturday', available: false, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'sunday', available: false, startTime: '09:00', endTime: '17:00' }
        ] as any
    };
    const [formData, setFormData] = useState(initialFormState);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const fetchData = async () => {
        try {
            const [coachesData, studiosData] = await Promise.all([coachesService.getAll(), studiosService.getAll()]);
            setCoaches(coachesData);
            setStudios(studiosData);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.filter((u: UserOption) => u.role === 'coach'));
            }
        } catch (err) { console.error('Failed to fetch users', err); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (isCreateModalOpen) fetchUsers(); }, [isCreateModalOpen]);

    const resetForm = () => { setFormData(initialFormState); setError(null); };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            await coachesService.create({ userId: formData.userId, studioId: formData.studioId, bio: formData.bio || undefined, specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : undefined });
            setIsCreateModalOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to create coach');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (coach: CoachDisplay) => {
        setSelectedCoach(coach);
        setFormData({
            userId: '',
            studioId: coach.studioId || '',
            bio: coach.bio || '',
            specializations: coach.specializations?.join(', ') || '',
            availabilityRules: (coach.availabilityRules as any) || initialFormState.availabilityRules
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoach) return;
        setSaving(true);
        try {
            await coachesService.update(selectedCoach.id, { bio: formData.bio, specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : [] });
            setIsEditModalOpen(false);
            setSelectedCoach(null);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Failed to update coach', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (coach: CoachDisplay) => {
        setSelectedCoach(coach);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCoach) return;
        setSaving(true);
        try {
            await coachesService.delete(selectedCoach.id);
            setIsDeleteDialogOpen(false);
            setSelectedCoach(null);
            fetchData();
        } catch (err) {
            console.error('Failed to delete coach', err);
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<CoachDisplay>[] = [
        {
            key: 'name', header: 'Name',
            render: (coach) => {
                const avatarUrl = getImageUrl(coach.avatarUrl);
                const initials = `${coach.firstName?.[0] || ''}${coach.lastName?.[0] || ''}`;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.75rem', overflow: 'hidden' }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={`${coach.firstName} ${coach.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : initials}
                        </div>
                        <div style={{ fontWeight: 500 }}>{coach.firstName} {coach.lastName}</div>
                    </div>
                );
            }
        },
        { key: 'email', header: 'Email', render: (coach) => <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}><Mail size={14} />{coach.email || '-'}</div> },
        { key: 'studio', header: 'Studio', render: (coach) => <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}><Building2 size={14} />{coach.studioName || '-'}</div> },
        {
            key: 'status', header: 'Status',
            render: (coach) => (
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: coach.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: coach.active ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {coach.active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof CoachDisplay, header: '',
            render: (coach: CoachDisplay) => <ActionButtons showEdit={canEdit} showDelete={canDelete} onEdit={() => handleEdit(coach)} onDelete={() => handleDeleteClick(coach)} />
        }] : [])
    ];

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none' };

    return (
        <div>
            <PageHeader title="Coaches" description="Manage your training staff" actionLabel="Add Coach" onAction={() => setIsCreateModalOpen(true)} />
            <DataTable columns={columns} data={coaches} isLoading={loading} />

            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetForm(); }} title="Assign Coach">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><AlertCircle size={16} /><span>{error}</span></div>}
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>To add a coach, first create a user with "Coach" role in User Management, then assign them here.</p>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Select User</label>
                        <select required value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })} style={inputStyle}>
                            <option value="">Choose a user...</option>
                            {users.map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>))}
                        </select>
                        {users.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>No users with "Coach" role available.</p>}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Select Studio</label>
                        <select required value={formData.studioId} onChange={e => setFormData({ ...formData, studioId: e.target.value })} style={inputStyle}>
                            <option value="">Choose a studio...</option>
                            {studios.filter(s => s.isActive).map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Bio (optional)</label>
                        <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Coach bio..." />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Specializations (comma-separated)</label>
                        <input type="text" value={formData.specializations} onChange={e => setFormData({ ...formData, specializations: e.target.value })} style={inputStyle} placeholder="e.g. EMS Training, Weight Loss" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { setIsCreateModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" disabled={saving || users.length === 0} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving || users.length === 0 ? 0.6 : 1 }}>{saving ? 'Assigning...' : 'Assign Coach'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit Coach">
                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Bio</label>
                        <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Coach bio..." />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Specializations (comma-separated)</label>
                        <input type="text" value={formData.specializations} onChange={e => setFormData({ ...formData, specializations: e.target.value })} style={inputStyle} placeholder="e.g. EMS Training, Weight Loss" />
                    </div>

                    {/* Availability Rules */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Weekly Availability</label>
                        {(formData.availabilityRules as any[]).map((rule, index) => (
                            <div key={rule.dayOfWeek} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{rule.dayOfWeek}</span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={rule.available}
                                            onChange={(e) => {
                                                const newRules = [...formData.availabilityRules as any[]];
                                                newRules[index] = { ...newRules[index], available: e.target.checked };
                                                setFormData({ ...formData, availabilityRules: newRules });
                                            }}
                                        />
                                        Available
                                    </label>
                                    {rule.available && (
                                        <>
                                            <input
                                                type="time"
                                                value={rule.startTime}
                                                onChange={(e) => {
                                                    const newRules = [...formData.availabilityRules as any[]];
                                                    newRules[index] = { ...newRules[index], startTime: e.target.value };
                                                    setFormData({ ...formData, availabilityRules: newRules });
                                                }}
                                                style={{ ...inputStyle, width: 'auto', padding: '0.5rem' }}
                                            />
                                            <span>to</span>
                                            <input
                                                type="time"
                                                value={rule.endTime}
                                                onChange={(e) => {
                                                    const newRules = [...formData.availabilityRules as any[]];
                                                    newRules[index] = { ...newRules[index], endTime: e.target.value };
                                                    setFormData({ ...formData, availabilityRules: newRules });
                                                }}
                                                style={{ ...inputStyle, width: 'auto', padding: '0.5rem' }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { setIsEditModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Update Coach'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => { setIsDeleteDialogOpen(false); setSelectedCoach(null); }} onConfirm={handleDeleteConfirm} title="Delete Coach" message={`Are you sure you want to delete ${selectedCoach?.firstName} ${selectedCoach?.lastName} as a coach?`} confirmLabel="Delete" isDestructive loading={saving} />
        </div>
    );
};

export default Coaches;
