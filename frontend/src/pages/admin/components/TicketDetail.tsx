import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    User,
    Clock,
    AlertCircle,
    Info,
    Shield
} from 'lucide-react';
import { supportService } from '../../../services/support.service';
import type { SupportTicket, TicketStatus } from '../../../services/support.service';

interface TicketDetailProps {
    ticketId: string;
    isOwner?: boolean;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, isOwner = false }) => {
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadTicket = async () => {
        setLoading(true);
        try {
            const data = await supportService.getTicket(ticketId);
            setTicket(data);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Failed to load ticket', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTicket();
    }, [ticketId]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSubmitting(true);
        try {
            await supportService.addMessage(ticketId, reply);
            setReply('');
            await loadTicket();
        } catch (error) {
            alert('Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (newStatus: TicketStatus) => {
        try {
            await supportService.updateStatus(ticketId, newStatus);
            await loadTicket();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading conversation...</div>;
    if (!ticket) return <div className="p-12 text-center text-red-500">Ticket not found</div>;

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'open': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'in_progress': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'resolved': return 'text-green-600 bg-green-50 border-green-100';
            case 'closed': return 'text-gray-600 bg-gray-50 border-gray-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Conversation Area */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[500px] shadow-sm">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {ticket.subject.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{ticket.subject}</h3>
                                <p className="text-xs text-gray-500">Started on {new Date(ticket.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px] bg-gray-50/30 dark:bg-slate-900/10">
                        {/* Initial Message */}
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500 shrink-0">
                                <User size={16} />
                            </div>
                            <div className="max-w-[80%] bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                                        {ticket.user?.firstName} {ticket.user?.lastName}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">Author</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                        </div>

                        {/* Thread Messages */}
                        {ticket.messages?.map((msg) => {
                            const isPlatformSender = !msg.user || msg.user?.id !== ticket.userId;
                            return (
                                <div key={msg.id} className={`flex gap-4 ${isPlatformSender ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPlatformSender ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'}`}>
                                        {isPlatformSender ? <Shield size={16} /> : <User size={16} />}
                                    </div>
                                    <div className={`max-w-[80%] p-4 rounded-2xl border ${isPlatformSender
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 rounded-tl-none shadow-sm'
                                        }`}>
                                        <div className={`flex items-center gap-2 mb-1 ${isPlatformSender ? 'justify-end' : ''}`}>
                                            {!isPlatformSender && (
                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {msg.user?.firstName} {msg.user?.lastName}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-medium ${isPlatformSender ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {isPlatformSender ? 'Support Team' : 'Author'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className={`text-sm whitespace-pre-wrap ${isPlatformSender ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {msg.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Input */}
                    {ticket.status !== 'closed' ? (
                        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <form onSubmit={handleSendReply} className="relative">
                                <textarea
                                    rows={2}
                                    value={reply}
                                    onChange={e => setReply(e.target.value)}
                                    placeholder="Type your reply here..."
                                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !reply.trim()}
                                    className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-center flex flex-col items-center gap-3">
                            <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                                <Clock size={16} /> This ticket is closed.
                            </p>
                            <button
                                onClick={() => handleUpdateStatus('open')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                            >
                                <Send size={16} className="rotate-[-45deg]" /> Re-open Ticket
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar / Info Area */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={16} /> Ticket Details
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Status</label>
                            {isOwner ? (
                                <select
                                    value={ticket.status}
                                    onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm font-medium"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            ) : (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border inline-block ${getStatusColor(ticket.status)}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Priority</label>
                            <span className={`text-sm font-bold flex items-center gap-2 ${ticket.priority === 'high' || ticket.priority === 'critical' ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                <AlertCircle size={14} /> {ticket.priority.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Category</label>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{ticket.category.replace('_', ' ')}</span>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                            <label className="text-xs text-gray-500 block mb-1">Created By</label>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.user?.firstName} {ticket.user?.lastName}</p>
                            <p className="text-xs text-gray-400">{ticket.user?.email}</p>
                        </div>
                        {isOwner && ticket.tenant && (
                            <div className="pt-2">
                                <label className="text-xs text-gray-500 block mb-1">Studio</label>
                                <p className="text-sm font-bold text-blue-600">{ticket.tenant.name}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions for Owner */}
                {isOwner && (
                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
                        <h4 className="font-bold mb-3 flex items-center gap-2"><Shield size={18} /> Owner Actions</h4>
                        <div className="space-y-2">
                            {ticket.status !== 'resolved' && (
                                <button
                                    onClick={() => handleUpdateStatus('resolved')}
                                    className="w-full py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
                                >
                                    Mark as Resolved
                                </button>
                            )}
                            {ticket.status !== 'closed' && (
                                <button
                                    onClick={() => handleUpdateStatus('closed')}
                                    className="w-full py-2 bg-blue-700 text-white rounded-lg text-sm font-bold hover:bg-blue-800 transition-colors border border-blue-500"
                                >
                                    Close Ticket
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDetail;
