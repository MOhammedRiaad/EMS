import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useWaitingListState } from './waiting-list/useWaitingListState';
import { WaitingListEntryCard } from './waiting-list/WaitingListEntryCard';
import { AddEntryModal } from './waiting-list/AddEntryModal';
import { BookSessionModal } from './waiting-list/BookSessionModal';

const AdminWaitingList: React.FC = () => {
    const state = useWaitingListState();

    const tabs = [
        { key: 'pending' as const, label: 'Pending Approval' },
        { key: 'queue' as const, label: 'Approved Queue' },
        { key: 'all' as const, label: 'All History' }
    ];

    return (
        <div>
            <PageHeader
                title="Waiting List Management"
                description="Manage client requests and queue priority"
                actionLabel="Add Manual Entry"
                onAction={() => state.setIsAddModalOpen(true)}
            />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => state.setActiveTab(tab.key)}
                        style={{
                            padding: '0.75rem 1rem',
                            borderBottom: state.activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: state.activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: state.activeTab === tab.key ? 600 : 400
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {state.loading ? (
                <div>Loading...</div>
            ) : state.filteredEntries.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No entries found in this view.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {state.filteredEntries.map(entry => (
                        <WaitingListEntryCard
                            key={entry.id}
                            entry={entry}
                            activeTab={state.activeTab}
                            onApprove={state.handleApprove}
                            onReject={state.handleReject}
                            onNotify={state.handleNotify}
                            onBook={state.openBookModal}
                            onPriorityChange={state.handlePriorityChange}
                            onDelete={state.handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Add Entry Modal */}
            <AddEntryModal
                isOpen={state.isAddModalOpen}
                onClose={() => state.setIsAddModalOpen(false)}
                formData={state.formData}
                setFormData={state.setFormData}
                clients={state.clients}
                studios={state.studios}
                onSubmit={state.handleCreate}
            />

            {/* Book Session Modal */}
            <BookSessionModal
                isOpen={state.isBookModalOpen}
                onClose={() => state.setIsBookModalOpen(false)}
                bookingData={state.bookingData}
                setBookingData={state.setBookingData}
                coaches={state.availableCoaches}
                rooms={state.rooms}
                loading={state.bookingLoading}
                onSubmit={state.handleBookSession}
            />
        </div>
    );
};

export default AdminWaitingList;
