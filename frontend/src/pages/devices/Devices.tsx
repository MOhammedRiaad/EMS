import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { devicesService, type Device } from '../../services/devices.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { Cpu, Building2, CheckCircle, Play, Wrench } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

const Devices: React.FC = () => {
    const { canEdit, canDelete } = usePermissions();
    const [devices, setDevices] = useState<Device[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ studioId: '', label: '', serialNumber: '', model: '', notes: '' });

    const fetchData = async () => {
        try {
            const [devicesData, studiosData] = await Promise.all([devicesService.getAll(), studiosService.getAll()]);
            setDevices(devicesData);
            setStudios(studiosData);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => setFormData({ studioId: '', label: '', serialNumber: '', model: '', notes: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await devicesService.create({ studioId: formData.studioId, label: formData.label, serialNumber: formData.serialNumber || undefined, model: formData.model || undefined, notes: formData.notes || undefined });
            setIsCreateModalOpen(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Failed to create device', err);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (device: Device) => {
        setSelectedDevice(device);
        setFormData({ studioId: device.studioId, label: device.label, serialNumber: device.serialNumber || '', model: device.model || '', notes: device.notes || '' });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDevice) return;
        setSaving(true);
        try {
            await devicesService.update(selectedDevice.id, formData);
            setIsEditModalOpen(false);
            setSelectedDevice(null);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Failed to update device', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (device: Device) => {
        setSelectedDevice(device);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDevice) return;
        setSaving(true);
        try {
            await devicesService.delete(selectedDevice.id);
            setIsDeleteDialogOpen(false);
            setSelectedDevice(null);
            fetchData();
        } catch (err) {
            console.error('Failed to delete device', err);
        } finally {
            setSaving(false);
        }
    };

    const getStatusIcon = (status: Device['status']) => {
        switch (status) {
            case 'available': return <CheckCircle size={14} color="#10b981" />;
            case 'in_use': return <Play size={14} color="#3b82f6" />;
            case 'maintenance': return <Wrench size={14} color="#f59e0b" />;
        }
    };

    const getStatusColor = (status: Device['status']) => {
        switch (status) {
            case 'available': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'in_use': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
            case 'maintenance': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
        }
    };

    const columns: Column<Device>[] = [
        {
            key: 'label', header: 'Device',
            render: (device) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Cpu size={16} /></div>
                    <div><div style={{ fontWeight: 500 }}>{device.label}</div>{device.model && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{device.model}</div>}</div>
                </div>
            )
        },
        { key: 'serialNumber', header: 'Serial #', render: (device) => <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{device.serialNumber || '-'}</span> },
        { key: 'studio', header: 'Studio', render: (device) => <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}><Building2 size={14} />{device.studio?.name || '-'}</div> },
        {
            key: 'status', header: 'Status',
            render: (device) => {
                const colors = getStatusColor(device.status);
                return (
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: colors.bg, color: colors.color, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getStatusIcon(device.status)}{device.status.replace('_', ' ')}
                    </span>
                );
            }
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Device, header: '',
            render: (device: Device) => <ActionButtons showEdit={canEdit} showDelete={canDelete} onEdit={() => handleEdit(device)} onDelete={() => handleDeleteClick(device)} />
        }] : [])
    ];

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', outline: 'none' };

    const renderForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Studio</label>
                <select required value={formData.studioId} onChange={e => setFormData({ ...formData, studioId: e.target.value })} style={inputStyle} disabled={isEdit}>
                    <option value="">Select a Studio</option>
                    {studios.filter(s => s.isActive).map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Device Label</label>
                <input type="text" required value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} style={inputStyle} placeholder="e.g. EMS Unit #1" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Serial Number</label>
                    <input type="text" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} style={inputStyle} placeholder="Optional" />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Model</label>
                    <input type="text" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} style={inputStyle} placeholder="Optional" />
                </div>
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} placeholder="Optional notes..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : isEdit ? 'Update Device' : 'Add Device'}</button>
            </div>
        </form>
    );

    return (
        <div>
            <PageHeader title="EMS Devices" description="Manage your EMS training equipment" actionLabel="Add Device" onAction={() => setIsCreateModalOpen(true)} />
            <DataTable columns={columns} data={devices} isLoading={loading} />
            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetForm(); }} title="Add EMS Device">{renderForm(handleCreate, false)}</Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit EMS Device">{renderForm(handleUpdate, true)}</Modal>
            <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => { setIsDeleteDialogOpen(false); setSelectedDevice(null); }} onConfirm={handleDeleteConfirm} title="Delete Device" message={`Are you sure you want to delete "${selectedDevice?.label}"?`} confirmLabel="Delete" isDestructive loading={saving} />
        </div>
    );
};

export default Devices;
