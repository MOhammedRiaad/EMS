import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { waitingListService, type WaitingListEntry, type CreateWaitingListEntryDto } from '../../services/waiting-list.service';
import { clientsService, type Client } from '../../services/clients.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { sessionsService } from '../../services/sessions.service';
import { coachesService } from '../../services/coaches.service';
import { roomsService } from '../../services/rooms.service';
import { Check, X, ArrowUp, ArrowDown, Clock, User, Calendar } from 'lucide-react';

const AdminWaitingList: React.FC = () => {
    // const { user } = useAuth(); // Unused
    const [entries, setEntries] = useState<WaitingListEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'queue' | 'all'>('pending');

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [formData, setFormData] = useState<CreateWaitingListEntryDto>({
        clientId: '',
        studioId: '',
        preferredDate: '',
        preferredTimeSlot: '',
        notes: '',
        requiresApproval: true
    });

    // Book Session Modal State
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [bookingData, setBookingData] = useState({
        startTime: '',
        endTime: '',
        coachId: '',
        roomId: '',
        programType: 'Personal Training'
    });
    const [bookingLoading, setBookingLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [clientsData, studiosData, coachesData, roomsData] = await Promise.all([
                clientsService.getAll(),
                studiosService.getAll(),
                coachesService.getAll(),
                roomsService.getAll()
            ]);
            setClients(clientsData);
            setStudios(studiosData);
            setCoaches(coachesData);
            setRooms(roomsData);

            // Set default studio if available
            if (studiosData.length > 0) {
                setFormData(prev => ({ ...prev, studioId: studiosData[0].id }));
            }
        } catch (error) {
            console.error('Error fetching dependencies:', error);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const data = await waitingListService.getAll();
            setEntries(data);
        } catch (error) {
            console.error('Error fetching waiting list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await waitingListService.create(formData);
            setIsAddModalOpen(false);
            setFormData({
                clientId: '',
                studioId: studios[0]?.id || '',
                preferredDate: '',
                preferredTimeSlot: '',
                notes: '',
                requiresApproval: true
            });
            fetchEntries();
        } catch (error) {
            console.error('Error creating entry:', error);
            alert('Failed to create entry');
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await waitingListService.approve(id);
            fetchEntries();
        } catch (error) {
            console.error('Error approving entry:', error);
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Are you sure you want to reject/cancel this request?')) return;
        try {
            await waitingListService.reject(id);
            fetchEntries();
        } catch (error) {
            console.error('Error rejecting entry:', error);
        }
    };

    const handlePriorityChange = async (id: string, currentPriority: number, direction: 'up' | 'down') => {
        // Simple priority swap logic could be implemented here, 
        // but for now let's just decrement (up) or increment (down) the priority value
        // Lower number = higher priority
        const newPriority = direction === 'up' ? currentPriority - 1 : currentPriority + 1;
        try {
            await waitingListService.updatePriority(id, newPriority);
            fetchEntries();
        } catch (error) {
            console.error('Error updating priority:', error);
        }
    };

    const handleNotify = async (id: string) => {
        try {
            await waitingListService.notify(id);
            fetchEntries();
            alert('Client notified successfully!');
        } catch (error) {
            console.error('Error notifying client:', error);
            alert('Failed to notify client');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this entry?')) return;
        try {
            await waitingListService.delete(id);
            fetchEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const openBookModal = (entry: WaitingListEntry) => {
        setSelectedEntry(entry);
        // Pre-fill with preferred date if available
        const preferredDate = entry.preferredDate
            ? new Date(entry.preferredDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        setBookingData({
            startTime: `${preferredDate}T09:00`,
            endTime: `${preferredDate}T10:00`,
            coachId: coaches[0]?.id || '',
            roomId: rooms[0]?.id || '',
            programType: 'Personal Training'
        });
        setIsBookModalOpen(true);
    };

    const handleBookSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEntry) return;

        setBookingLoading(true);
        try {
            // Create the session
            await sessionsService.create({
                clientId: selectedEntry.clientId,
                studioId: selectedEntry.studioId,
                coachId: bookingData.coachId,
                roomId: bookingData.roomId,
                startTime: new Date(bookingData.startTime).toISOString(),
                endTime: new Date(bookingData.endTime).toISOString(),
                programType: bookingData.programType
            });

            // Mark waiting list entry as booked
            await waitingListService.markAsBooked(selectedEntry.id);

            setIsBookModalOpen(false);
            setSelectedEntry(null);
            fetchEntries();
            alert('Session booked successfully!');
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error booking session:', error);
            alert(error.message || 'Failed to book session');
        } finally {
            setBookingLoading(false);
        }
    };

    const filteredEntries = entries.filter(entry => {
        if (activeTab === 'pending') return entry.status === 'pending';
        if (activeTab === 'queue') return entry.status === 'approved' || entry.status === 'notified';
        return true;
    });

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

    return (
        <div>
            <PageHeader
                title="Waiting List Management"
                description="Manage client requests and queue priority"
                actionLabel="Add Manual Entry"
                onAction={() => setIsAddModalOpen(true)}
            />

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add to Waiting List"
            >
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Client</label>
                        <select
                            required
                            value={formData.clientId}
                            onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)'
                            }}
                        >
                            <option value="">Select client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Studio</label>
                        <select
                            required
                            value={formData.studioId}
                            onChange={e => setFormData({ ...formData, studioId: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)'
                            }}
                        >
                            <option value="">Select studio...</option>
                            {studios.map(studio => (
                                <option key={studio.id} value={studio.id}>{studio.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Preferred Date</label>
                            <input
                                type="date"
                                value={formData.preferredDate}
                                onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Time Preference</label>
                            <select
                                value={formData.preferredTimeSlot}
                                onChange={e => setFormData({ ...formData, preferredTimeSlot: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)'
                                }}
                            >
                                <option value="">Any time</option>
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="evening">Evening</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Specific requirements..."
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid var(--border-color)',
                                minHeight: '80px',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>


                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: 'var(--border-radius-md)'
                            }}
                        >
                            Add to List
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {['pending', 'queue', 'all'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            padding: '0.75rem 1rem',
                            borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === tab ? 600 : 400,
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'queue' ? 'Approved Queue' : tab === 'all' ? 'All History' : 'Pending Approval'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : filteredEntries.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No entries found in this view.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredEntries.map(entry => (
                        <div key={entry.id} style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-bg-primary)',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
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

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {entry.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApprove(entry.id)}
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
                                            onClick={() => handleReject(entry.id)}
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
                                )}

                                {(entry.status === 'approved' || entry.status === 'notified') && (
                                    <>
                                        {entry.status === 'approved' && (
                                            <button
                                                onClick={() => handleNotify(entry.id)}
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
                                            onClick={() => openBookModal(entry)}
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
                                            onClick={() => handlePriorityChange(entry.id, entry.priority, 'up')}
                                            style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}
                                            title="Move Up Priority"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => handlePriorityChange(entry.id, entry.priority, 'down')}
                                            style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}
                                            title="Move Down Priority"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            style={{ padding: '0.5rem', color: 'var(--color-danger)' }}
                                            title="Delete Entry"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}


            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add to Waiting List"
            >
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    Manually adding entries is coming soon.
                </div>
            </Modal>

            {/* Book Session Modal */}
            <Modal
                isOpen={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                title="Book Session"
            >
                <form onSubmit={handleBookSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Date</label>
                            <input
                                type="date"
                                required
                                value={bookingData.startTime.split('T')[0]}
                                onChange={e => {
                                    const date = e.target.value;
                                    const time = bookingData.startTime.split('T')[1] || '09:00';
                                    const endTime = bookingData.endTime.split('T')[1] || '10:00';
                                    setBookingData({
                                        ...bookingData,
                                        startTime: `${date}T${time}`,
                                        endTime: `${date}T${endTime}`
                                    });
                                }}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Time</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="time"
                                    required
                                    value={bookingData.startTime.split('T')[1] || ''}
                                    onChange={e => {
                                        const date = bookingData.startTime.split('T')[0];
                                        const startTime = e.target.value;
                                        setBookingData({
                                            ...bookingData,
                                            startTime: `${date}T${startTime}`,
                                            endTime: `${date}T${startTime}` // Simple default
                                        });
                                    }}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                                <span>-</span>
                                <input
                                    type="time"
                                    required
                                    value={bookingData.endTime.split('T')[1] || ''}
                                    onChange={e => {
                                        const date = bookingData.endTime.split('T')[0];
                                        setBookingData({
                                            ...bookingData,
                                            endTime: `${date}T${e.target.value}`
                                        });
                                    }}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Coach</label>
                        <select
                            required
                            value={bookingData.coachId}
                            onChange={e => setBookingData({ ...bookingData, coachId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                        >
                            <option value="">Select Coach...</option>
                            {coaches.map((coach: any) => (
                                <option key={coach.id} value={coach.id}>{coach.user?.firstName} {coach.user?.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Room / Device</label>
                        <select
                            required
                            value={bookingData.roomId}
                            onChange={e => setBookingData({ ...bookingData, roomId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                        >
                            <option value="">Select Room...</option>
                            {rooms.map((room: any) => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsBookModalOpen(false)}
                            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={bookingLoading}
                            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-md)', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', opacity: bookingLoading ? 0.7 : 1 }}
                        >
                            {bookingLoading ? 'Booking...' : 'Confirm Book'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default AdminWaitingList;
