import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterBar from '../../components/common/FilterBar';
import { type Session } from '../../services/sessions.service';
import { usePermissions } from '../../hooks/usePermissions';
import { useSessionsState } from './useSessionsState';
import SessionStatusModal from './SessionStatusModal';
import SessionDetailsModal from './SessionDetailsModal';
import { User, Users } from 'lucide-react';

const Sessions: React.FC = () => {
    const navigate = useNavigate();
    const { canEdit, canDelete } = usePermissions();
    const state = useSessionsState();
    const [selectedSessionDetails, setSelectedSessionDetails] = React.useState<Session | null>(null);
    const [activeTab, setActiveTab] = React.useState<'upcoming' | 'history'>('upcoming');

    const filteredByTab = React.useMemo(() => {
        return state.filteredSessions.filter(session => {
            const isFinished = ['completed', 'cancelled', 'no_show'].includes(session.status);
            if (activeTab === 'upcoming') {
                return !isFinished;
            } else {
                return isFinished;
            }
        });
    }, [state.filteredSessions, activeTab]);

    const handleSessionRefresh = () => {
        state.refresh();
    };

    const columns: Column<Session>[] = [
        {
            key: 'startTime',
            header: 'Time',
            render: (session) => {
                const date = new Date(session.startTime);
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{date.toLocaleDateString()}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'client',
            header: 'Client / Group',
            render: (session) => {
                if (session.type === 'group') {
                    return (
                        <div
                            className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            onClick={() => setSelectedSessionDetails(session)}
                        >
                            <Users size={14} />
                            <span className="font-medium">
                                Group ({session.participants?.length || 0}/{session.capacity || '-'})
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{session.client ? `${session.client.firstName} ${session.client.lastName}` : 'Unknown Client'}</span>
                    </div>
                );
            }
        },
        {
            key: 'coach',
            header: 'Coach',
            render: (session) => {
                const coachName = session.coach?.user
                    ? `${session.coach.user.firstName || ''} ${session.coach.user.lastName || ''}`
                    : 'Unassigned';
                return <span className="text-gray-600 dark:text-gray-400">{coachName}</span>;
            }
        },
        {
            key: 'room',
            header: 'Room',
            render: (session) => (
                <span className="text-gray-600 dark:text-gray-400">
                    {session.room?.name || '-'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (session) => {
                let bgClass = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
                if (session.status === 'scheduled') bgClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
                else if (session.status === 'completed') bgClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
                else if (session.status === 'cancelled' || session.status === 'no_show') bgClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgClass}`}>
                        {session.status}
                    </span>
                );
            }
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof Session,
            header: 'Actions',
            render: (session: Session) => (
                <div className="flex gap-2 flex-wrap items-center">
                    {session.status === 'scheduled' && canEdit && session.type !== 'group' && (
                        <>
                            <button
                                onClick={() => state.handleStatusClick(session, 'completed')}
                                className="px-2 py-1 text-xs rounded border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            >
                                Complete
                            </button>
                            <button
                                onClick={() => state.handleStatusClick(session, 'no_show')}
                                className="px-2 py-1 text-xs rounded border border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 transition-colors"
                            >
                                No-Show
                            </button>
                            <button
                                onClick={() => state.handleStatusClick(session, 'cancelled')}
                                className="px-2 py-1 text-xs rounded border border-red-500 bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                    {session.type === 'group' && (
                        <button
                            onClick={() => setSelectedSessionDetails(session)}
                            className="px-2 py-1 text-xs rounded border border-blue-500 bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            Manage
                        </button>
                    )}
                    <ActionButtons
                        showEdit={canEdit && session.status === 'scheduled'}
                        showDelete={canDelete}
                        onEdit={() => navigate(`/sessions/${session.id}/edit`)}
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
                onAction={() => navigate('/sessions/new')}
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

            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upcoming'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
            </div>

            <DataTable
                key={state.refreshKey}
                columns={columns}
                data={filteredByTab}
                isLoading={state.loading}
            />

            {/* Note: Create/Edit Modals moved to separate pages */}

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                isOpen={state.isDeleteDialogOpen}
                onClose={() => { state.setIsDeleteDialogOpen(false); state.setSelectedSession(null); }}
                onConfirm={state.handleDeleteConfirm}
                title="Cancel Session"
                message={
                    <div className="flex flex-col gap-3">
                        <p>Are you sure you want to cancel this session? This action cannot be undone.</p>
                        {state.selectedSession && (state.selectedSession.isRecurringParent || state.selectedSession.parentSessionId) && (
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                                <input
                                    type="checkbox"
                                    checked={state.deleteSeries}
                                    onChange={(e) => state.setDeleteSeries(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">Cancel entire series (future sessions)</span>
                            </label>
                        )}
                    </div>
                }
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

            {/* Session Details Modal (For Group Sessions) */}
            <SessionDetailsModal
                isOpen={!!selectedSessionDetails}
                onClose={() => setSelectedSessionDetails(null)}
                session={selectedSessionDetails}
                onSessionUpdated={handleSessionRefresh}
            />
        </div>
    );
};

export default Sessions;
