import React from 'react';
import { X, Mail, Phone, User, Edit, Trash2, Clock, MessageSquare, UserPlus } from 'lucide-react';
import { type Lead } from '../../../../services/lead.service';

interface LeadDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onEdit: (lead: Lead) => void;
    onConvert: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
}

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ isOpen, onClose, lead, onEdit, onConvert, onDelete }) => {
    if (!isOpen || !lead) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'contacted': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'trial_booked': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'converted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'lost': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl border border-gray-200 dark:border-gray-800 animate-fade-in-up h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                            {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                {lead.firstName} {lead.lastName}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(lead.status)}`}>
                                    {lead.status.replace('_', ' ')}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                <Clock size={14} /> Created {new Date(lead.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Details */}
                        <div className="md:col-span-1 space-y-6">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Info</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <Mail size={16} className="text-gray-400" />
                                        <a href={`mailto:${lead.email}`} className="hover:text-purple-600 truncate">{lead.email}</a>
                                    </div>
                                    {lead.phone && (
                                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Phone size={16} className="text-gray-400" />
                                            <a href={`tel:${lead.phone}`} className="hover:text-purple-600">{lead.phone}</a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assigned To</h3>
                                {lead.assignedTo ? (
                                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                        <User size={16} className="text-gray-400" />
                                        <span>{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Unassigned</span>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Source</h3>
                                <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg inline-block">
                                    {lead.source || 'Unknown'}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                                    {lead.notes || 'No notes added.'}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Timeline / Activity */}
                        <div className="md:col-span-2 border-l border-gray-100 dark:border-gray-800 pl-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageSquare size={16} /> Activity Timeline
                            </h3>

                            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:-translate-x-1/2 before:bg-gray-200 dark:before:bg-gray-700 before:h-full">
                                {/* Current mock activities - ideally these come from lead.activities */}
                                <div className="relative flex items-start gap-4">
                                    <div className="absolute left-0 ml-2.5 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-purple-600"></div>
                                    <div className="flex-1 pt-0.5">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">Lead Created</p>
                                        <p className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Placeholder for real activities */}
                                {/* 
                                {lead.activities?.map(activity => (
                                    <div key={activity.id} className="relative flex items-start gap-4">
                                        ...
                                    </div>
                                ))} 
                                */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={() => onDelete(lead)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                    <button
                        onClick={() => onEdit(lead)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Edit size={16} /> Edit
                    </button>
                    {lead.status !== 'converted' && (
                        <button
                            onClick={() => onConvert(lead)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm font-medium shadow-sm shadow-green-600/20"
                        >
                            <UserPlus size={16} /> Convert to Client
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeadDetailsModal;
