import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, X, Loader2, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '../../services/api';

interface WaitlistEntry {
    id: string;
    studioName: string;
    preferredDate: string;
    preferredTimeSlot: string;
    notes?: string;
    status: 'pending' | 'booked' | 'cancelled' | 'expired';
    createdAt: string;
    position?: number;
}

const ClientWaitlist: React.FC = () => {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState<string | null>(null);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const data = await authenticatedFetch('/client-portal/waiting-list');
            setEntries(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load waiting list:', err);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to leave this waiting list?')) return;

        try {
            setCancelling(id);
            await authenticatedFetch(`/client-portal/waiting-list/${id}`, { method: 'DELETE' });
            loadEntries();
        } catch (err) {
            console.error('Failed to cancel entry:', err);
            alert('Failed to leave waiting list');
        } finally {
            setCancelling(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'booked':
                return <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Booked</span>;
            case 'cancelled':
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Cancelled</span>;
            case 'expired':
                return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Expired</span>;
            default:
                return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">Waiting</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const activeEntries = entries.filter(e => e.status === 'pending');
    const pastEntries = entries.filter(e => e.status !== 'pending');

    return (
        <div className="max-w-lg mx-auto pb-20 space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="text-blue-600" size={24} />
                My Waiting List
            </h1>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    When a spot opens up, we'll automatically book it for you and send a confirmation.
                </p>
            </div>

            {/* Active Entries */}
            <div className="space-y-3">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Requests</h2>
                {activeEntries.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-900 rounded-xl">
                        <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No active waiting list entries</p>
                    </div>
                ) : (
                    activeEntries.map(entry => (
                        <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium mb-1">
                                        <Calendar size={14} className="text-gray-400" />
                                        {new Date(entry.preferredDate).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Clock size={14} className="text-gray-400" />
                                        {entry.preferredTimeSlot}
                                    </div>
                                </div>
                                {getStatusBadge(entry.status)}
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                <MapPin size={12} />
                                {entry.studioName}
                            </div>

                            {entry.position && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-3">
                                    Position #{entry.position} in queue
                                </div>
                            )}

                            {entry.notes && (
                                <p className="text-xs text-gray-500 mb-3">{entry.notes}</p>
                            )}

                            <button
                                onClick={() => handleCancel(entry.id)}
                                disabled={cancelling === entry.id}
                                className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                {cancelling === entry.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                Leave Waiting List
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Past Entries */}
            {pastEntries.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">History</h2>
                    {pastEntries.map(entry => (
                        <div key={entry.id} className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 opacity-70">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(entry.preferredDate).toLocaleDateString()} at {entry.preferredTimeSlot}
                                </span>
                                {getStatusBadge(entry.status)}
                            </div>
                            <p className="text-xs text-gray-500">{entry.studioName}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientWaitlist;
