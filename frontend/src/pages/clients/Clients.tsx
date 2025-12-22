import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { clientsService } from '../../services/clients.service';
import type { Client } from '../../services/clients.service';
import { Mail, Phone, Upload, User } from 'lucide-react';
import { storageService } from '../../services/storage.service';

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ firstName: '', lastName: '', email: '', phone: '', avatarUrl: '' });
    const [uploading, setUploading] = useState(false);

    const fetchClients = async () => {
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await clientsService.create({ ...newClient, status: 'active' });
            setIsModalOpen(false);
            setNewClient({ firstName: '', lastName: '', email: '', phone: '', avatarUrl: '' });
            fetchClients();
        } catch (error) {
            console.error('Failed to create client', error);
        }
    };

    const columns: Column<Client>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (client) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                        fontWeight: 600, fontSize: '0.75rem', overflow: 'hidden'
                    }}>
                        {client.avatarUrl ? (
                            <img src={client.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            client.firstName[0] + client.lastName[0]
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{client.firstName} {client.lastName}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email',
            render: (client) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Mail size={14} />
                    {client.email || '-'}
                </div>
            )
        },
        {
            key: 'phone',
            header: 'Phone',
            render: (client) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Phone size={14} />
                    {client.phone || '-'}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (client) => (
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: client.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: client.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}>
                    {client.status}
                </span>
            )
        }
    ];

    return (
        <div>
            <PageHeader
                title="Clients"
                description="Manage your client base"
                actionLabel="Add Client"
                onAction={() => setIsModalOpen(true)}
            />

            <DataTable
                columns={columns}
                data={clients}
                isLoading={loading}
                onRowClick={(client) => console.log('Clicked client', client)}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Client">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                backgroundColor: 'var(--color-bg-primary)', border: '1px dashed var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                            }}>
                                {newClient.avatarUrl ? (
                                    <img src={`http://localhost:3000${newClient.avatarUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={32} color="var(--color-text-muted)" />
                                )}
                            </div>
                            <label style={{
                                position: 'absolute', bottom: 0, right: 0,
                                backgroundColor: 'var(--color-primary)', borderRadius: '50%', padding: '0.25rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Upload size={14} color="white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setUploading(true);
                                            try {
                                                const url = await storageService.upload(file);
                                                setNewClient(prev => ({ ...prev, avatarUrl: url }));
                                            } catch (err) {
                                                console.error(err);
                                            } finally {
                                                setUploading(false);
                                            }
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>First Name</label>
                            <input type="text" required value={newClient.firstName} onChange={e => setNewClient({ ...newClient, firstName: e.target.value })} className="input-field" style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Last Name</label>
                            <input type="text" required value={newClient.lastName} onChange={e => setNewClient({ ...newClient, lastName: e.target.value })} className="input-field" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Email</label>
                        <input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="input-field" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Phone</label>
                        <input type="tel" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="input-field" style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)' }}>Create Client</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none'
};

export default Clients;
