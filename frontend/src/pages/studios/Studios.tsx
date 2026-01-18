import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { studiosService, type Studio } from '../../services/studios.service';
import { MapPin } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

const Studios: React.FC = () => {
    const { canEdit, canDelete } = usePermissions();
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
    const [saving, setSaving] = useState(false);

    interface FormState {
        name: string;
        address: string;
        city: string;
        country: string;
        openingHours: Record<string, { open: string; close: string } | null>;
    }

    const initialFormState: FormState = {
        name: '',
        address: '',
        city: '',
        country: '',
        openingHours: {
            monday: { open: '09:00', close: '21:00' },
            tuesday: { open: '09:00', close: '21:00' },
            wednesday: { open: '09:00', close: '21:00' },
            thursday: { open: '09:00', close: '21:00' },
            friday: { open: '09:00', close: '21:00' },
            saturday: { open: '10:00', close: '18:00' },
            sunday: null // Closed
        }
    };
    const [formData, setFormData] = useState<FormState>(initialFormState);

    const fetchStudios = async () => {
        try {
            const data = await studiosService.getAll();
            setStudios(data);
        } catch (error) {
            console.error('Failed to fetch studios', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudios(); }, []);

    const resetForm = () => setFormData(initialFormState);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await studiosService.create(formData);
            setIsCreateModalOpen(false);
            resetForm();
            fetchStudios();
        } catch (error) {
            console.error('Failed to create studio', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (studio: Studio) => {
        setSelectedStudio(studio);
        setFormData({
            name: studio.name,
            address: studio.address || '',
            city: studio.city || '',
            country: studio.country || '',
            openingHours: studio.openingHours || initialFormState.openingHours
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudio) return;
        setSaving(true);
        try {
            await studiosService.update(selectedStudio.id, formData);
            setIsEditModalOpen(false);
            setSelectedStudio(null);
            resetForm();
            fetchStudios();
        } catch (error) {
            console.error('Failed to update studio', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (studio: Studio) => {
        setSelectedStudio(studio);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedStudio) return;
        setSaving(true);
        try {
            await studiosService.delete(selectedStudio.id);
            setIsDeleteDialogOpen(false);
            setSelectedStudio(null);
            fetchStudios();
        } catch (error) {
            console.error('Failed to delete studio', error);
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<Studio>[] = [
        { key: 'name', header: 'Name' },
        {
            key: 'location',
            header: 'Location',
            render: (studio) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <MapPin size={14} />
                    {studio.city || '-'}, {studio.country || '-'}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (studio) => (
                <span style={{
                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                    backgroundColor: studio.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: studio.isActive ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}>
                    {studio.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Studio,
            header: '',
            render: (studio: Studio) => (
                <ActionButtons showEdit={canEdit} showDelete={canDelete} onEdit={() => handleEdit(studio)} onDelete={() => handleDeleteClick(studio)} />
            )
        }] : [])
    ];

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none' };

    const renderForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Studio Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Address</label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>City</label>
                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} style={inputStyle} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Country</label>
                    <input type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} style={inputStyle} />
                </div>
            </div>

            {/* Opening Hours */}
            <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Opening Hours</label>
                {Object.keys(formData.openingHours).map((key) => {
                    const day = key as keyof typeof formData.openingHours;
                    const hours = formData.openingHours[day];
                    const isClosed = !hours;
                    return (
                        <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{day}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={!isClosed}
                                        onChange={(e) => {
                                            const newHours = { ...formData.openingHours };
                                            newHours[day] = e.target.checked ? { open: '09:00', close: '21:00' } : null;
                                            setFormData({ ...formData, openingHours: newHours });
                                        }}
                                    />
                                    Open
                                </label>
                                {!isClosed && hours && (
                                    <>
                                        <input
                                            type="time"
                                            value={hours.open}
                                            onChange={(e) => {
                                                const newHours = { ...formData.openingHours };
                                                if (newHours[day]) {
                                                    newHours[day] = { ...newHours[day]!, open: e.target.value };
                                                    setFormData({ ...formData, openingHours: newHours });
                                                }
                                            }}
                                            style={{ ...inputStyle, width: 'auto', padding: '0.5rem' }}
                                        />
                                        <span>to</span>
                                        <input
                                            type="time"
                                            value={hours.close}
                                            onChange={(e) => {
                                                const newHours = { ...formData.openingHours };
                                                if (newHours[day]) {
                                                    newHours[day] = { ...newHours[day]!, close: e.target.value };
                                                    setFormData({ ...formData, openingHours: newHours });
                                                }
                                            }}
                                            style={{ ...inputStyle, width: 'auto', padding: '0.5rem' }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving...' : isEdit ? 'Update Studio' : 'Create Studio'}
                </button>
            </div>
        </form>
    );

    return (
        <div>
            <PageHeader title="Studios" description="Manage studio locations" actionLabel="Add Studio" onAction={() => setIsCreateModalOpen(true)} />
            <DataTable columns={columns} data={studios} isLoading={loading} />
            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetForm(); }} title="New Studio">{renderForm(handleCreate, false)}</Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit Studio">{renderForm(handleUpdate, true)}</Modal>
            <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => { setIsDeleteDialogOpen(false); setSelectedStudio(null); }} onConfirm={handleDeleteConfirm} title="Delete Studio" message={`Are you sure you want to delete "${selectedStudio?.name}"? This will also affect associated rooms and devices.`} confirmLabel="Delete" isDestructive loading={saving} />
        </div>
    );
};

export default Studios;
