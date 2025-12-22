import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { studiosService } from '../../services/studios.service';
import type { Studio } from '../../services/studios.service';
import { MapPin } from 'lucide-react';

const Studios: React.FC = () => {
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudio, setNewStudio] = useState({ name: '', address: '', city: '', country: '' });

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

    useEffect(() => {
        fetchStudios();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await studiosService.create(newStudio);
            setIsModalOpen(false);
            setNewStudio({ name: '', address: '', city: '', country: '' });
            fetchStudios();
        } catch (error) {
            console.error('Failed to create studio', error);
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
                    {studio.city}, {studio.country}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (studio) => (
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: studio.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: studio.isActive ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}>
                    {studio.isActive ? 'Active' : 'Inactive'}
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
            <PageHeader title="Studios" description="Manage studio locations" actionLabel="Add Studio" onAction={() => setIsModalOpen(true)} />
            <DataTable columns={columns} data={studios} isLoading={loading} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Studio">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Studio Name</label>
                        <input type="text" required value={newStudio.name} onChange={e => setNewStudio({ ...newStudio, name: e.target.value })} className="input-field" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Address</label>
                        <input type="text" value={newStudio.address} onChange={e => setNewStudio({ ...newStudio, address: e.target.value })} className="input-field" style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>City</label>
                            <input type="text" value={newStudio.city} onChange={e => setNewStudio({ ...newStudio, city: e.target.value })} className="input-field" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Country</label>
                            <input type="text" value={newStudio.country} onChange={e => setNewStudio({ ...newStudio, country: e.target.value })} className="input-field" style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)' }}>Create Studio</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Studios;
