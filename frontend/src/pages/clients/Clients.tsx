import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterBar from '../../components/common/FilterBar';
import { type Client } from '../../services/clients.service';
import { Mail, Phone, Package } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import ClientPackages from '../../components/clients/ClientPackages';
import { getImageUrl } from '../../utils/imageUtils';
import { useClientsState } from './useClientsState';
import ClientForm from './ClientForm';

const Clients: React.FC = () => {
    const { canEdit, canDelete } = usePermissions();
    const state = useClientsState();
    const navigate = useNavigate();

    const columns: Column<Client>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (client) => {
                const avatarUrl = getImageUrl(client.avatarUrl);
                const initials = `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            overflow: 'hidden'
                        }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={`${client.firstName} ${client.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : initials}
                        </div>
                        <div style={{ fontWeight: 500 }}>{client.firstName} {client.lastName}</div>
                    </div>
                );
            }
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
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Client,
            header: '',
            render: (client: Client) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        title="View Details"
                        style={{
                            padding: '0.375rem 0.5rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span style={{ fontSize: 12, fontWeight: 600 }}>VIEW</span>
                    </button>
                    <button
                        onClick={() => state.handleToggleActive(client.id, client.status)}
                        style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: client.status === 'active' ? 'var(--color-danger)' : 'var(--color-success)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {client.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        onClick={() => state.handleManagePackages(client)}
                        title="Manage Packages"
                        style={{
                            padding: '0.375rem 0.5rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Package size={14} />
                    </button>
                    <ActionButtons
                        showEdit={canEdit}
                        showDelete={canDelete}
                        onEdit={() => state.handleEdit(client)}
                        onDelete={() => state.handleDeleteClick(client)}
                    />
                </div>
            )
        }] : [])
    ];

    return (
        <div>
            <PageHeader
                title="Clients"
                description="Manage your client base"
                actionLabel="Add Client"
                onAction={() => state.setIsCreateModalOpen(true)}
            />

            <FilterBar
                searchPlaceholder="Search clients by name, email, or phone..."
                searchValue={state.searchQuery}
                onSearchChange={state.setSearchQuery}
                dropdowns={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                            { value: 'suspended', label: 'Suspended' }
                        ]
                    }
                ]}
                filters={state.filters}
                onFilterChange={state.handleFilterChange}
                onClearAll={state.handleClearFilters}
            />

            <DataTable columns={columns} data={state.filteredClients} isLoading={state.loading} />

            {/* Create Modal */}
            <Modal
                isOpen={state.isCreateModalOpen}
                onClose={() => { state.setIsCreateModalOpen(false); state.resetForm(); }}
                title="New Client"
            >
                <ClientForm
                    formData={state.formData}
                    setFormData={state.setFormData}
                    uploading={state.uploading}
                    saving={state.saving}
                    isEdit={false}
                    onSubmit={state.handleCreate}
                    onCancel={() => { state.setIsCreateModalOpen(false); state.resetForm(); }}
                    onAvatarUpload={state.handleAvatarUpload}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={state.isEditModalOpen}
                onClose={() => { state.setIsEditModalOpen(false); state.resetForm(); }}
                title="Edit Client"
            >
                <ClientForm
                    formData={state.formData}
                    setFormData={state.setFormData}
                    uploading={state.uploading}
                    saving={state.saving}
                    isEdit={true}
                    onSubmit={state.handleUpdate}
                    onCancel={() => { state.setIsEditModalOpen(false); state.resetForm(); }}
                    onAvatarUpload={state.handleAvatarUpload}
                />
            </Modal>

            {/* Delete Dialog */}
            <ConfirmDialog
                isOpen={state.isDeleteDialogOpen}
                onClose={() => { state.setIsDeleteDialogOpen(false); state.setSelectedClient(null); }}
                onConfirm={state.handleDeleteConfirm}
                title="Delete Client"
                message={`Are you sure you want to delete ${state.selectedClient?.firstName} ${state.selectedClient?.lastName}? This action cannot be undone.`}
                confirmLabel="Delete"
                isDestructive
                loading={state.saving}
            />

            {/* Package Modal */}
            <Modal
                isOpen={state.isPackageModalOpen}
                onClose={() => { state.setIsPackageModalOpen(false); state.setSelectedClient(null); }}
                title={`${state.selectedClient?.firstName} ${state.selectedClient?.lastName} - Packages`}
            >
                {state.selectedClient && (
                    <ClientPackages
                        clientId={state.selectedClient.id}
                        clientName={`${state.selectedClient.firstName} ${state.selectedClient.lastName}`}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Clients;
