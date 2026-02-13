import React, { useState, useEffect } from 'react';
import {
    LifeBuoy,
    Plus,
    MessageSquare,
    Clock,
    CheckCircle2,
    ChevronRight,
    Search,
    Filter,
    X
} from 'lucide-react';
import { supportService } from '../../services/support.service';
import type { SupportTicket, TicketStatus, TicketPriority, TicketCategory } from '../../services/support.service';
import TicketDetail from './components/TicketDetail';

const Support: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    // Create form state
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState<TicketCategory>('technical');
    const [priority, setPriority] = useState<TicketPriority>('low');
    const [submitting, setSubmitting] = useState(false);

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

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await supportService.createTicket({
                subject,
                message,
                category,
                priority
            });
            setShowCreateModal(false);
            setSubject('');
            setMessage('');
            loadTickets();
        } catch (error) {
            alert('Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'open': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'in_progress': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'resolved': return 'text-green-600 bg-green-50 border-green-100';
            case 'closed': return 'text-gray-600 bg-gray-50 border-gray-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    if (selectedTicketId) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedTicketId(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ChevronRight size={20} className="rotate-180" /> Back to Tickets
                </button>
                <TicketDetail ticketId={selectedTicketId} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <LifeBuoy className="text-blue-600" /> Support & Help
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Get assistance with your studio management</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-all shadow-sm"
                >
                    <Plus size={18} /> New Support Ticket
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all flex items-center gap-2">
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No support tickets yet</h3>
                            <p className="text-gray-500 mb-6">Need help? Create a ticket and our team will assist you.</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Create your first ticket
                            </button>
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ticket.status === 'open' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                        {ticket.status === 'resolved' ? <CheckCircle2 size={20} /> : <MessageSquare size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{ticket.subject}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{ticket.message}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            <span className="capitalize">{ticket.category}</span>
                                            <span className={`capitalize ${ticket.priority === 'high' || ticket.priority === 'critical' ? 'text-red-500 font-medium' : ''}`}>
                                                {ticket.priority} Priority
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl scale-in-center">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus className="text-blue-600" /> New Support Ticket
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Briefly describe your issue"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value as TicketCategory)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="technical">Technical Issue</option>
                                        <option value="billing">Billing & Subscription</option>
                                        <option value="feature_request">Feature Request</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value as TicketPriority)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detailed Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Provide more details about the issue..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {submitting ? 'Creating...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
