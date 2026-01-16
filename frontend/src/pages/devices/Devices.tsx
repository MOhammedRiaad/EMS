import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { devicesService, type Device } from '../../services/devices.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { Cpu, Building2, AlertCircle, Wrench, CheckCircle, Play } from 'lucide-react';

const Devices: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newDevice, setNewDevice] = useState({
        studioId: '',
        label: '',
        serialNumber: '',
        model: '',
        notes: ''
    });

    const fetchData = async () => {
        try {
            const [devicesData, studiosData] = await Promise.all([
                devicesService.getAll(),
                studiosService.getAll()
            ]);
            setDevices(devicesData);
            setStudios(studiosData);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCreating(true);
        try {
            await devicesService.create({
                studioId: newDevice.studioId,
                label: newDevice.label,
                serialNumber: newDevice.serialNumber || undefined,
                model: newDevice.model || undefined,
                notes: newDevice.notes || undefined
            });
            setIsModalOpen(false);
            setNewDevice({ studioId: '', label: '', serialNumber: '', model: '', notes: '' });
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to create device');
        } finally {
            setCreating(false);
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
            key: 'label',
            header: 'Device',
            render: (device) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        backgroundColor: 'var(--color-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <Cpu size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{device.label}</div>
                        {device.model && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{device.model}</div>}
                    </div>
                </div>
            )
        },
        {
            key: 'serialNumber',
            header: 'Serial #',
            render: (device) => <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{device.serialNumber || '-'}</span>
        },
        {
            key: 'studio',
            header: 'Studio',
            render: (device) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Building2 size={14} />
                    {device.studio?.name || '-'}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (device) => {
                const colors = getStatusColor(device.status);
                return (
                    <span style={{
                        padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                        backgroundColor: colors.bg, color: colors.color,
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                        {getStatusIcon(device.status)}
                        {device.status.replace('_', ' ')}
                    </span>
                );
            }
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
                title="EMS Devices"
                description="Manage your EMS training equipment"
                actionLabel="Add Device"
                onAction={() => setIsModalOpen(true)}
            />

            <DataTable columns={columns} data={devices} isLoading={loading} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add EMS Device">
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

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Studio</label>
                        <select required value={newDevice.studioId} onChange={e => setNewDevice({ ...newDevice, studioId: e.target.value })} style={inputStyle}>
                            <option value="">Select a Studio</option>
                            {studios.filter(s => s.isActive).map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Device Label</label>
                        <input type="text" required value={newDevice.label} onChange={e => setNewDevice({ ...newDevice, label: e.target.value })} style={inputStyle} placeholder="e.g. EMS Unit #1" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Serial Number</label>
                            <input type="text" value={newDevice.serialNumber} onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })} style={inputStyle} placeholder="Optional" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Model</label>
                            <input type="text" value={newDevice.model} onChange={e => setNewDevice({ ...newDevice, model: e.target.value })} style={inputStyle} placeholder="Optional" />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Notes</label>
                        <textarea value={newDevice.notes} onChange={e => setNewDevice({ ...newDevice, notes: e.target.value })} style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} placeholder="Optional notes..." />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" disabled={creating} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: creating ? 0.6 : 1 }}>
                            {creating ? 'Adding...' : 'Add Device'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Devices;
