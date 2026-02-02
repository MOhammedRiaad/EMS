import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, X, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { authenticatedFetch } from '../../services/api';

interface WaitlistEntry {
    id: string;
    studio?: {
        name: string;
    };
    preferredDate: string;
    preferredTimeSlot: string;
    notes?: string;
    status: 'pending' | 'booked' | 'cancelled' | 'expired' | 'notified';
    createdAt: string;
    position?: number;
    session?: {
        room?: {
            name: string;
        };
    };
}

const ClientWaitlistTab: React.FC = () => {
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
                return <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full dark:bg-green-900/30 dark:text-green-400">Booked</span>;
            case 'cancelled':
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full dark:bg-gray-800 dark:text-gray-400">Cancelled</span>;
            case 'expired':
                return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full dark:bg-red-900/30 dark:text-red-400">Expired</span>;
            case 'notified':
                return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900/30 dark:text-purple-400">Notification Sent</span>;
            default:
                return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">Waiting</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const activeEntries = entries.filter(e => e.status === 'pending' || e.status === 'notified');
    const pastEntries = entries.filter(e => e.status !== 'pending' && e.status !== 'notified');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    When a spot opens up matching your preferences, we'll notify you or automatically book it based on availability.
                </p>
            </div>

            {/* Active Entries */}
            <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 ml-1">Active Requests</h3>
                {activeEntries.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                        <Clock className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No active waiting list entries</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeEntries.map(entry => (
                            <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 transition-all hover:shadow-md">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-base text-gray-900 dark:text-white font-medium mb-1">
                                            <Calendar size={16} className="text-purple-500" />
                                            {new Date(entry.preferredDate).toLocaleDateString(undefined, {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Clock size={16} className="text-purple-500" />
                                            {entry.preferredTimeSlot}
                                        </div>
                                    </div>
                                    {getStatusBadge(entry.status)}
                                </div>

                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
                                        <MapPin size={14} />
                                        {entry.studio?.name || 'Any Studio'}
                                    </div>

                                    {entry.position && (
                                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg font-medium">
                                            <ArrowRight size={14} />
                                            Position #{entry.position} in queue
                                        </div>
                                    )}
                                </div>

                                {entry.notes && (
                                    <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg mb-4 text-xs text-gray-600 dark:text-gray-400 italic">
                                        "{entry.notes}"
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleCancel(entry.id)}
                                        disabled={cancelling === entry.id}
                                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                        {cancelling === entry.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                        Withdraw Request
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Entries */}
            {pastEntries.length > 0 && (
                <div className="pt-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 ml-1">History</h3>
                    <div className="space-y-3">
                        {pastEntries.map(entry => (
                            <div key={entry.id} className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-4 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {new Date(entry.preferredDate).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{entry.preferredTimeSlot}</span>
                                    </div>
                                    {getStatusBadge(entry.status)}
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                                    <span>{entry.studio?.name}</span>
                                    {entry.session?.room?.name && (
                                        <span>Room: {entry.session.room.name}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientWaitlistTab;
