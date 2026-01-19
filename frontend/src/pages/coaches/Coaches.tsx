import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterBar from '../../components/common/FilterBar';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { Mail, Building2, AlertCircle } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { getImageUrl } from '../../utils/imageUtils';

const Coaches: React.FC = () => {
    const navigate = useNavigate();
    const { canEdit, canDelete } = usePermissions();
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<CoachDisplay | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        studioId: 'all',
        activeStatus: 'all' // 'all', 'active', 'inactive'
    });
    const initialFormState = {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: 'male' as 'male' | 'female' | 'other' | 'pnts',
        studioId: '',
        bio: '',
        specializations: '',
        preferredClientGender: 'any' as 'male' | 'female' | 'any',
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

    useEffect(() => { fetchData(); }, []);

    // Filtered coaches
    const filteredCoaches = useMemo(() => {
        return coaches.filter(coach => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(query);
                const matchesEmail = coach.email?.toLowerCase().includes(query) || false;
                const matchesSpecializations = coach.specializations?.some(s =>
                    s.toLowerCase().includes(query)
                ) || false;
                if (!matchesName && !matchesEmail && !matchesSpecializations) return false;
            }

            // Studio filter
            if (filters.studioId !== 'all' && coach.studioId !== filters.studioId) {
                return false;
            }

            // Active status filter
            if (filters.activeStatus === 'active' && !coach.active) {
                return false;
            }
            if (filters.activeStatus === 'inactive' && coach.active) {
                return false;
            }

            return true;
        });
    }, [coaches, searchQuery, filters]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilters({ studioId: 'all', activeStatus: 'all' });
    };

    const resetForm = () => { setFormData(initialFormState); setError(null); };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            await coachesService.createWithUser({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                studioId: formData.studioId,
                bio: formData.bio || undefined,
                specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : undefined,
                preferredClientGender: formData.preferredClientGender
            });
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
            email: coach.email || '',
            password: '', // Don't populate on edit
            firstName: coach.firstName,
            lastName: coach.lastName,
            gender: 'male', // Default
            studioId: coach.studioId || '',
            bio: coach.bio || '',
            specializations: coach.specializations?.join(', ') || '',
            preferredClientGender: coach.preferredClientGender || 'any',
            availabilityRules: (coach.availabilityRules as any) || initialFormState.availabilityRules
        });
        setIsEditModalOpen(true);
    };

    const handleToggleActive = async (coachId: string, currentActive: boolean) => {
        try {
            await coachesService.update(coachId, { active: !currentActive });
            fetchData();
        } catch (err) {
            console.error('Failed to toggle coach status', err);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoach) return;
        setSaving(true);
        try {
            await coachesService.update(selectedCoach.id, {
                bio: formData.bio,
                specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : [],
                preferredClientGender: formData.preferredClientGender
            });
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
            render: (coach: CoachDisplay) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => handleToggleActive(coach.id, coach.active)}
                        style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: coach.active ? 'var(--color-danger)' : 'var(--color-success)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {coach.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <ActionButtons showEdit={canEdit} showDelete={canDelete} onEdit={() => handleEdit(coach)} onDelete={() => handleDeleteClick(coach)} />
                </div>
            )
        }] : [])
    ];

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none' };

    return (
        <div>
            <PageHeader
                title="Coaches"
                description="Manage your training staff"
                actionLabel="Add Coach"
                onAction={() => navigate('/coaches/create')}
            />

            <FilterBar
                searchPlaceholder="Search coaches by name, email, or specialization..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                dropdowns={[
                    {
                        key: 'activeStatus',
                        label: 'Status',
                        options: [
                            { value: 'active', label: 'Active Only' },
                            { value: 'inactive', label: 'Inactive Only' }
                        ]
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
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearFilters}
            />

            <DataTable columns={columns} data={filteredCoaches} isLoading={loading} />

            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetForm(); }} title="Create Coach">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><AlertCircle size={16} /><span>{error}</span></div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>First Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Last Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} style={inputStyle} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                        <input type="password" required minLength={6} placeholder="Min 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={inputStyle} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Gender <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                        <select required value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })} style={inputStyle}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="pnts">Prefer not to say</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Select Studio <span style={{ color: 'var(--color-danger)' }}>*</span></label>
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
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Preferred Client Gender</label>
                        <select value={formData.preferredClientGender} onChange={e => setFormData({ ...formData, preferredClientGender: e.target.value as any })} style={inputStyle}>
                            <option value="any">Any</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { setIsCreateModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>{saving ? 'Creating...' : 'Create Coach'}</button>
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
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Preferred Client Gender</label>
                        <select value={formData.preferredClientGender} onChange={e => setFormData({ ...formData, preferredClientGender: e.target.value as any })} style={inputStyle}>
                            <option value="any">Any</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
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
