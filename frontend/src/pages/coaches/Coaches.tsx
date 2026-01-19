import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterBar from '../../components/common/FilterBar';
import { type CoachDisplay } from '../../services/coaches.service';
import { Mail, Building2 } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { getImageUrl } from '../../utils/imageUtils';
import { useCoachesState } from './useCoachesState';
import CoachForm from './CoachForm';

const Coaches: React.FC = () => {
    const navigate = useNavigate();
    const { canEdit, canDelete } = usePermissions();
    const state = useCoachesState();

    const columns: Column<CoachDisplay>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (coach) => {
                const avatarUrl = getImageUrl(coach.avatarUrl);
                const initials = `${coach.firstName?.[0] || ''}${coach.lastName?.[0] || ''}`;
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
                                <img src={avatarUrl} alt={`${coach.firstName} ${coach.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : initials}
                        </div>
                        <div style={{ fontWeight: 500 }}>{coach.firstName} {coach.lastName}</div>
                    </div>
                );
            }
        },
        {
            key: 'email',
            header: 'Email',
            render: (coach) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Mail size={14} />{coach.email || '-'}
                </div>
            )
        },
        {
            key: 'studio',
            header: 'Studio',
            render: (coach) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Building2 size={14} />{coach.studioName || '-'}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (coach) => (
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: coach.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: coach.active ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}>
                    {coach.active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof CoachDisplay,
            header: '',
            render: (coach: CoachDisplay) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => state.handleToggleActive(coach.id, coach.active)}
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
                    <ActionButtons
                        showEdit={canEdit}
                        showDelete={canDelete}
                        onEdit={() => state.handleEdit(coach)}
                        onDelete={() => state.handleDeleteClick(coach)}
                    />
                </div>
            )
        }] : [])
    ];

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
                searchValue={state.searchQuery}
                onSearchChange={state.setSearchQuery}
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
                        options: state.studios.filter(s => s.isActive).map(s => ({
                            value: s.id,
                            label: s.name
                        }))
                    }
                ]}
                filters={state.filters}
                onFilterChange={state.handleFilterChange}
                onClearAll={state.handleClearFilters}
            />

            <DataTable columns={columns} data={state.filteredCoaches} isLoading={state.loading} />

            {/* Create Modal */}
            <Modal
                isOpen={state.isCreateModalOpen}
                onClose={() => { state.setIsCreateModalOpen(false); state.resetForm(); }}
                title="Create Coach"
            >
                <CoachForm
                    formData={state.formData}
                    setFormData={state.setFormData}
                    studios={state.studios}
                    error={state.error}
                    saving={state.saving}
                    isEdit={false}
                    onSubmit={state.handleCreate}
                    onCancel={() => { state.setIsCreateModalOpen(false); state.resetForm(); }}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={state.isEditModalOpen}
                onClose={() => { state.setIsEditModalOpen(false); state.resetForm(); }}
                title="Edit Coach"
            >
                <CoachForm
                    formData={state.formData}
                    setFormData={state.setFormData}
                    studios={state.studios}
                    error={state.error}
                    saving={state.saving}
                    isEdit={true}
                    onSubmit={state.handleUpdate}
                    onCancel={() => { state.setIsEditModalOpen(false); state.resetForm(); }}
                />
            </Modal>

            {/* Delete Dialog */}
            <ConfirmDialog
                isOpen={state.isDeleteDialogOpen}
                onClose={() => { state.setIsDeleteDialogOpen(false); state.setSelectedCoach(null); }}
                onConfirm={state.handleDeleteConfirm}
                title="Delete Coach"
                message={`Are you sure you want to delete ${state.selectedCoach?.firstName} ${state.selectedCoach?.lastName} as a coach?`}
                confirmLabel="Delete"
                isDestructive
                loading={state.saving}
            />
        </div>
    );
};

export default Coaches;
