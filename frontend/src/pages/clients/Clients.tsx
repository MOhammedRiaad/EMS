import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { clientsService, type Client } from '../../services/clients.service';
import { Mail, Phone, Upload, User, Package, Send } from 'lucide-react';
import { storageService } from '../../services/storage.service';
import { usePermissions } from '../../hooks/usePermissions';
import ClientPackages from '../../components/clients/ClientPackages';

const Clients: React.FC = () => {
    const { canEdit, canDelete } = usePermissions();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', avatarUrl: '' });

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

    useEffect(() => { fetchClients(); }, []);

    const resetForm = () => setFormData({ firstName: '', lastName: '', email: '', phone: '', avatarUrl: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await clientsService.create({ ...formData, status: 'active' });
            setIsCreateModalOpen(false);
            resetForm();
            fetchClients();
        } catch (error) {
            console.error('Failed to create client', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setFormData({
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email || '',
            phone: client.phone || '',
            avatarUrl: client.avatarUrl || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setSaving(true);
        try {
            await clientsService.update(selectedClient.id, formData);
            setIsEditModalOpen(false);
            setSelectedClient(null);
            resetForm();
            fetchClients();
        } catch (error) {
            console.error('Failed to update client', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (client: Client) => {
        setSelectedClient(client);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedClient) return;
        setSaving(true);
        try {
            await clientsService.delete(selectedClient.id);
            setIsDeleteDialogOpen(false);
            setSelectedClient(null);
            fetchClients();
        } catch (error) {
            console.error('Failed to delete client', error);
        } finally {
            setSaving(false);
        }
    };

    const handleInvite = async (client: Client) => {
        if (!client.email) {
            alert('Client must have an email address to receive an invitation.');
            return;
        }
        if (!confirm(`Send invitation email to ${client.firstName}?`)) return;

        try {
            await clientsService.invite(client.id);
            alert('Invitation sent successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to send invitation');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await storageService.upload(file);
                setFormData(prev => ({ ...prev, avatarUrl: url }));
            } catch (err) {
                console.error(err);
            } finally {
                setUploading(false);
            }
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
                            (client.firstName[0] || '') + (client.lastName[0] || '')
                        )}
                    </div>
                    <div style={{ fontWeight: 500 }}>{client.firstName} {client.lastName}</div>
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
                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                    backgroundColor: client.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: client.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}>
                    {client.status}
                </span>
            )
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Client,
            header: '',
            render: (client: Client) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => handleInvite(client)}
                        style={{
                            padding: '0.25rem 0.5rem',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer'
                        }}
                        title="Send Invitation"
                    >
                        <Send size={16} />
                    </button>
                    <button
                        onClick={() => { setSelectedClient(client); setIsPackageModalOpen(true); }}
                        style={{ padding: '0.25rem 0.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="View Packages"
                    >
                        <Package size={16} />
                    </button>
                    <ActionButtons
                        showEdit={canEdit}
                        showDelete={canDelete}
                        onEdit={() => handleEdit(client)}
                        onDelete={() => handleDeleteClick(client)}
                    />
                </div>
            )
        }] : [])
    ];

    const inputStyle = {
        width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)', outline: 'none'
    };

    const renderForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-primary)', border: '1px dashed var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                        {formData.avatarUrl ? (
                            <img src={`http://localhost:3000${formData.avatarUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>First Name</label>
                    <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} style={inputStyle} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Last Name</label>
                    <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} style={inputStyle} />
                </div>
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Phone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false); resetForm(); }} style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--border-radius-md)', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
                </button>
            </div>
        </form>
    );

    return (
        <div>
            <PageHeader title="Clients" description="Manage your client base" actionLabel="Add Client" onAction={() => setIsCreateModalOpen(true)} />
            <DataTable columns={columns} data={clients} isLoading={loading} />

            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetForm(); }} title="New Client">
                {renderForm(handleCreate, false)}
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit Client">
                {renderForm(handleUpdate, true)}
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => { setIsDeleteDialogOpen(false); setSelectedClient(null); }}
                onConfirm={handleDeleteConfirm}
                title="Delete Client"
                message={`Are you sure you want to delete ${selectedClient?.firstName} ${selectedClient?.lastName}? This action cannot be undone.`}
                confirmLabel="Delete"
                isDestructive
                loading={saving}
            />

            <Modal
                isOpen={isPackageModalOpen}
                onClose={() => { setIsPackageModalOpen(false); setSelectedClient(null); }}
                title={`${selectedClient?.firstName} ${selectedClient?.lastName} - Packages`}
            >
                {selectedClient && (
                    <ClientPackages
                        clientId={selectedClient.id}
                        clientName={`${selectedClient.firstName} ${selectedClient.lastName}`}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Clients;
