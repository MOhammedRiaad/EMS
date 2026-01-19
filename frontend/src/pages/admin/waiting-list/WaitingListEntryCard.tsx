import React from 'react';
import { Check, X, ArrowUp, ArrowDown, Clock, User, Calendar } from 'lucide-react';
import type { WaitingListEntry } from '../../../services/waiting-list.service';

interface WaitingListEntryCardProps {
    entry: WaitingListEntry;
    activeTab: 'pending' | 'queue' | 'all';
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onNotify: (id: string) => void;
    onBook: (entry: WaitingListEntry) => void;
    onPriorityChange: (id: string, priority: number, direction: 'up' | 'down') => void;
    onDelete: (id: string) => void;
}

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        notified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        booked: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        cancelled: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 dark:bg-slate-700 dark:text-gray-300'}`}>
            {status.toUpperCase()}
        </span>
    );
};

export const WaitingListEntryCard: React.FC<WaitingListEntryCardProps> = ({
    entry,
    activeTab,
    onApprove,
    onReject,
    onNotify,
    onBook,
    onPriorityChange,
    onDelete
}) => {
    return (
        <div style={{
            padding: '1rem',
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            {/* Entry Info */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>
                        {entry.client.firstName} {entry.client.lastName}
                    </span>
                    {getStatusBadge(entry.status)}
                    {entry.priority && activeTab === 'queue' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Priority: {entry.priority}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        {entry.preferredDate ? new Date(entry.preferredDate).toLocaleDateString() : 'Any Date'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} />
                        {entry.preferredTimeSlot || (entry.session ? `${entry.session.startTime} - ${entry.session.endTime}` : 'Any Time')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={14} />
                        {entry.coach ? `${entry.coach.user.firstName} ${entry.coach.user.lastName}` : 'Any Coach'}
                    </div>
                </div>
                {entry.notes && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                        "{entry.notes}"
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {entry.status === 'pending' && (
                    <PendingActions entryId={entry.id} onApprove={onApprove} onReject={onReject} />
                )}

                {(entry.status === 'approved' || entry.status === 'notified') && (
                    <ApprovedActions
                        entry={entry}
                        onNotify={onNotify}
                        onBook={onBook}
                        onPriorityChange={onPriorityChange}
                        onDelete={onDelete}
                    />
                )}
            </div>
        </div>
    );
};

// Sub-components for action buttons
const PendingActions: React.FC<{
    entryId: string;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}> = ({ entryId, onApprove, onReject }) => (
    <>
        <button
            onClick={() => onApprove(entryId)}
            style={{
                padding: '0.5rem',
                backgroundColor: 'var(--color-success)',
                color: 'white',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
            }}
            title="Approve"
        >
            <Check size={16} /> Approve
        </button>
        <button
            onClick={() => onReject(entryId)}
            style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--border-radius-sm)'
            }}
            title="Reject"
        >
            <X size={16} />
        </button>
    </>
);

const ApprovedActions: React.FC<{
    entry: WaitingListEntry;
    onNotify: (id: string) => void;
    onBook: (entry: WaitingListEntry) => void;
    onPriorityChange: (id: string, priority: number, direction: 'up' | 'down') => void;
    onDelete: (id: string) => void;
}> = ({ entry, onNotify, onBook, onPriorityChange, onDelete }) => (
    <>
        {entry.status === 'approved' && (
            <button
                onClick={() => onNotify(entry.id)}
                style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 'var(--border-radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem'
                }}
                title="Notify Client"
            >
                📧 Notify
            </button>
        )}
        <button
            onClick={() => onBook(entry)}
            style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--color-success)',
                color: 'white',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem'
            }}
            title="Book Session"
        >
            <Check size={14} /> Book
        </button>
        <button
            onClick={() => onPriorityChange(entry.id, entry.priority, 'up')}
            style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}
            title="Move Up Priority"
        >
            <ArrowUp size={16} />
        </button>
        <button
            onClick={() => onPriorityChange(entry.id, entry.priority, 'down')}
            style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}
            title="Move Down Priority"
        >
            <ArrowDown size={16} />
        </button>
        <button
            onClick={() => onDelete(entry.id)}
            style={{ padding: '0.5rem', color: 'var(--color-danger)' }}
            title="Delete Entry"
        >
            <X size={16} />
        </button>
    </>
);

export default WaitingListEntryCard;
