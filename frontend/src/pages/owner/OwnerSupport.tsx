import React, { useState, useEffect } from 'react';
import {
    Shield,
    MessageSquare,
    Clock,
    Search,
    ChevronRight,
    Users
} from 'lucide-react';
import { supportService } from '../../services/support.service';
import type { SupportTicket, TicketStatus } from '../../services/support.service';
import TicketDetail from '../admin/components/TicketDetail';

const OwnerSupport: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [filter, setFilter] = useState<TicketStatus | 'all'>('all');

    const loadTickets = async () => {
        setLoading(true);
        try {
            const data = await supportService.getTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to load tickets', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'open': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'in_progress': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'resolved': return 'text-green-600 bg-green-50 border-green-100';
            case 'closed': return 'text-gray-600 bg-gray-50 border-gray-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const filteredTickets = filter === 'all'
        ? tickets
        : tickets.filter(t => t.status === filter);

    if (selectedTicketId) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => {
                        setSelectedTicketId(null);
                        loadTickets(); // Refresh list when coming back
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ChevronRight size={20} className="rotate-180" /> Back to Global Inbox
                </button>
                <TicketDetail ticketId={selectedTicketId} isOwner={true} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600" /> Platform Support Center
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage support requests across all tenants</p>
                </div>
            </div>

            {/* Stats / Quick Filter */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'All Tickets', count: tickets.length, value: 'all', color: 'blue' },
                    { label: 'Open', count: tickets.filter(t => t.status === 'open').length, value: 'open', color: 'amber' },
                    { label: 'In Progress', count: tickets.filter(t => t.status === 'in_progress').length, value: 'in_progress', color: 'indigo' },
                    { label: 'Resolved', count: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length, value: 'resolved', color: 'green' }
                ].map((stat) => (
                    <button
                        key={stat.label}
                        onClick={() => setFilter(stat.value as any)}
                        className={`p-4 rounded-xl border transition-all text-left ${filter === stat.value
                            ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-md ring-2 ring-blue-500/10'
                            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm'
                            }`}
                    >
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${filter === stat.value ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>{stat.count}</p>
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by subject, studio or user..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading global inbox...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-20 text-center text-gray-500">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No tickets found matching your filter.</p>
                        </div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ticket.status === 'open' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white truncate max-w-[300px]">{ticket.subject}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                                                <Users size={10} /> {ticket.tenant?.name || 'Unknown Studio'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="font-medium text-gray-600 dark:text-gray-300">{ticket.user?.firstName} {ticket.user?.lastName}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            <span className={`capitalize ${ticket.priority === 'high' || ticket.priority === 'critical' ? 'text-red-500 font-bold' : ''}`}>
                                                {ticket.priority} Priority
                                            </span>
                                            <span className="capitalize">{ticket.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">{ticket.messages?.length || 0} messages</p>
                                        <p className="text-[10px] text-gray-400">Last updated {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OwnerSupport;
