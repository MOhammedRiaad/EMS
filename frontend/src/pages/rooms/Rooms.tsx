import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { roomsService, type Room } from '../../services/rooms.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { usePermissions } from '../../hooks/usePermissions';

const Rooms: React.FC = () => {
    const { canEdit, canDelete } = usePermissions();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [saving, setSaving] = useState(false);
    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', capacity: 2, studioId: '' });

    const fetchData = async () => {
        try {
            const [roomsData, studiosData] = await Promise.all([roomsService.getAll(), studiosService.getAll()]);
            setRooms(roomsData);
            setStudios(studiosData);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => setFormData({ name: '', capacity: 2, studioId: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await roomsService.create(formData);
            setIsCreateModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Failed to create room', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (room: Room) => {
        setSelectedRoom(room);
        setFormData({ name: room.name, capacity: room.capacity, studioId: room.studioId });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoom) return;
        setSaving(true);
        try {
            await roomsService.update(selectedRoom.id, formData);
            setIsEditModalOpen(false);
            setSelectedRoom(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Failed to update room', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (room: Room) => {
        setSelectedRoom(room);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRoom) return;
        setSaving(true);
        try {
            await roomsService.delete(selectedRoom.id);
            setIsDeleteDialogOpen(false);
            setSelectedRoom(null);
            fetchData();
        } catch (error) {
            console.error('Failed to delete room', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleClick = (room: Room) => {
        setSelectedRoom(room);
        setIsToggleDialogOpen(true);
    };

    const handleToggleConfirm = async () => {
        if (!selectedRoom) return;
        setSaving(true);
        try {
            await roomsService.update(selectedRoom.id, { active: !selectedRoom.active });
            setIsToggleDialogOpen(false);
            setSelectedRoom(null);
            fetchData();
        } catch (error) {
            console.error('Failed to toggle room availability', error);
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<Room>[] = [
        { key: 'name', header: 'Room Name' },
        { key: 'studio', header: 'Studio', render: (room) => room.studio?.name || '-' },
        { key: 'capacity', header: 'Capacity' },
        {
            key: 'active' as keyof Room,
            header: 'Status',
            render: (room: Room) => (
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: room.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: room.active ? '#10b981' : '#ef4444'
                }}>
                    {room.active ? 'Available' : 'Unavailable'}
                </span>
            )
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Room,
            header: 'Actions',
            render: (room: Room) => (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {canEdit && (
                        <button
                            onClick={() => handleToggleClick(room)}
                            style={{
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                border: room.active ? '1px solid #ef4444' : '1px solid #10b981',
                                backgroundColor: room.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: room.active ? '#ef4444' : '#10b981',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            {room.active ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                    )}
                    <ActionButtons showEdit={canEdit} showDelete={canDelete} onEdit={() => handleEdit(room)} onDelete={() => handleDeleteClick(room)} />
                </div>
            )
        }] : [])
    ];

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none' };

    const renderForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Room Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Studio</label>
                <select required value={formData.studioId} onChange={e => setFormData({ ...formData, studioId: e.target.value })} style={inputStyle} disabled={isEdit}>
                    <option value="">Select Studio</option>
                    {studios.filter(s => s.isActive).map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Capacity</label>
                <input type="number" min="1" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving...' : isEdit ? 'Update Room' : 'Create Room'}
                </button>
            </div>
        </form>
    );

    return (
        <div>
            <PageHeader title="Rooms" description="Manage treatment rooms" actionLabel="Add Room" onAction={() => setIsCreateModalOpen(true)} />
            <DataTable columns={columns} data={rooms} isLoading={loading} />
            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetForm(); }} title="New Room">{renderForm(handleCreate, false)}</Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit Room">{renderForm(handleUpdate, true)}</Modal>
            <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => { setIsDeleteDialogOpen(false); setSelectedRoom(null); }} onConfirm={handleDeleteConfirm} title="Delete Room" message={`Are you sure you want to delete "${selectedRoom?.name}"?`} confirmLabel="Delete" isDestructive loading={saving} />
            <ConfirmDialog
                isOpen={isToggleDialogOpen}
                onClose={() => { setIsToggleDialogOpen(false); setSelectedRoom(null); }}
                onConfirm={handleToggleConfirm}
                title={selectedRoom?.active ? "Mark Room Unavailable" : "Mark Room Available"}
                message={selectedRoom?.active ? `Mark "${selectedRoom?.name}" as unavailable? It will not appear in session scheduling.` : `Mark "${selectedRoom?.name}" as available? It will be available for session scheduling.`}
                confirmLabel={selectedRoom?.active ? "Mark Unavailable" : "Mark Available"}
                isDestructive={selectedRoom?.active || false}
                loading={saving}
            />
        </div>
    );
};

export default Rooms;
