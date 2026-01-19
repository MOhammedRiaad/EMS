import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterBar from '../../components/common/FilterBar';
import { type Session } from '../../services/sessions.service';
import { User } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useSessionsState } from './useSessionsState';
import SessionForm from './SessionForm';
import SessionStatusModal from './SessionStatusModal';

const Sessions: React.FC = () => {
    const { canEdit, canDelete } = usePermissions();
    const state = useSessionsState();

    const columns: Column<Session>[] = [
        {
            key: 'startTime',
            header: 'Time',
            render: (session) => {
                const date = new Date(session.startTime);
                return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{date.toLocaleDateString()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'client',
            header: 'Client',
            render: (session) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} color="var(--color-text-secondary)" />
                    <span>{session.client ? `${session.client.firstName} ${session.client.lastName}` : 'Unknown Client'}</span>
                </div>
            )
        },
        {
            key: 'coach',
            header: 'Coach',
            render: (session) => {
                const coachName = session.coach?.user
                    ? `${session.coach.user.firstName || ''} ${session.coach.user.lastName || ''}`
                    : 'Unassigned';
                return <span style={{ color: 'var(--color-text-secondary)' }}>{coachName}</span>;
            }
        },
        {
            key: 'room',
            header: 'Room',
            render: (session) => (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                    {session.room?.name || '-'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (session) => (
                <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: session.status === 'scheduled' ? 'rgba(59, 130, 246, 0.1)' :
                        session.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: session.status === 'scheduled' ? '#3b82f6' :
                        session.status === 'completed' ? '#10b981' : 'var(--color-text-muted)'
                }}>
                    {session.status}
                </span>
            )
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Session,
            header: 'Actions',
            render: (session: Session) => (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {session.status === 'scheduled' && canEdit && (
                        <>
                            <button onClick={() => state.handleStatusClick(session, 'completed')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: 'pointer' }}>Complete</button>
                            <button onClick={() => state.handleStatusClick(session, 'no_show')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}>No-Show</button>
                            <button onClick={() => state.handleStatusClick(session, 'cancelled')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}>Cancel</button>
                        </>
                    )}
                    <ActionButtons
                        showEdit={canEdit && session.status === 'scheduled'}
                        showDelete={canDelete}
                        onEdit={() => state.handleEdit(session)}
                        onDelete={() => state.handleDeleteClick(session)}
                    />
                </div>
            )
        }] : [])
    ];

    return (
        <div key={state.refreshKey}>
            <PageHeader
                title="Sessions"
                description="Manage training sessions"
                actionLabel="Schedule Session"
                onAction={() => state.setIsCreateModalOpen(true)}
            />

            <FilterBar
                searchPlaceholder="Search by client or coach name..."
                searchValue={state.searchQuery}
                onSearchChange={state.setSearchQuery}
                dropdowns={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                            { value: 'no_show', label: 'No Show' }
                        ]
                    },
                    {
                        key: 'coachId',
                        label: 'Coach',
                        options: state.coaches.map(c => ({
                            value: c.id,
                            label: `${c.firstName} ${c.lastName}`
                        }))
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
                dateRange={{
                    fromKey: 'dateFrom',
                    toKey: 'dateTo',
                    label: 'Date Range'
                }}
                filters={state.filters}
                onFilterChange={state.handleFilterChange}
                onClearAll={state.handleClearFilters}
            />

            <DataTable
                key={state.refreshKey}
                columns={columns}
                data={state.filteredSessions}
                isLoading={state.loading}
            />

            {/* Create Modal */}
            <Modal
                isOpen={state.isCreateModalOpen}
                onClose={() => { state.setIsCreateModalOpen(false); state.resetForm(); }}
                title="Schedule Session"
            >
                <SessionForm
                    formData={state.formData}
                    setFormData={state.setFormData}
                    clients={state.clients}
                    coaches={state.coaches}
                    studios={state.studios}
                    rooms={state.rooms}
                    devices={state.devices}
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
                title="Reschedule Session"
            >
                <SessionForm
                    formData={state.formData}
                    setFormData={state.setFormData}
                    clients={state.clients}
                    coaches={state.coaches}
                    studios={state.studios}
                    rooms={state.rooms}
                    devices={state.devices}
                    error={state.error}
                    saving={state.saving}
                    isEdit={true}
                    onSubmit={state.handleUpdate}
                    onCancel={() => { state.setIsEditModalOpen(false); state.resetForm(); }}
                />
            </Modal>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                isOpen={state.isDeleteDialogOpen}
                onClose={() => { state.setIsDeleteDialogOpen(false); state.setSelectedSession(null); }}
                onConfirm={state.handleDeleteConfirm}
                title="Cancel Session"
                message="Are you sure you want to cancel this session? This action cannot be undone."
                confirmLabel="Cancel Session"
                isDestructive
                loading={state.saving}
            />

            {/* Status Change Modal */}
            <SessionStatusModal
                isOpen={state.isStatusModalOpen}
                statusAction={state.statusAction}
                cancelReason={state.cancelReason}
                setCancelReason={state.setCancelReason}
                showDeductChoice={state.showDeductChoice}
                deductSessionChoice={state.deductSessionChoice}
                setDeductSessionChoice={state.setDeductSessionChoice}
                saving={state.saving}
                onConfirm={state.handleStatusConfirm}
                onClose={state.closeStatusModal}
            />
        </div>
    );
};

export default Sessions;
