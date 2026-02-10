import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { leadService, type Lead } from '../../../../services/lead.service';
import { Plus, Phone, Mail, Clock } from 'lucide-react';
import LeadForm from './LeadForm';
import LeadActionMenu from './LeadActionMenu';
import LeadConversionModal from './LeadConversionModal';
import { LeadBookTrialModal } from './LeadBookTrialModal';

import LeadDetailsModal from './LeadDetailsModal';

import { LEAD_STATUS_CONFIG, LEAD_STATUS_ORDER, LeadStatus } from '../../../../types/lead-status';

const LeadKanbanBoard: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isBookTrialModalOpen, setIsBookTrialModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
    const [leadToEdit, setLeadToEdit] = useState<Lead | undefined>(undefined);
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickAddValue, setQuickAddValue] = useState('');
    const [filters, setFilters] = useState({ assignee: '', source: '' });

    // ...

    const getColumnLeads = (status: string) => {
        return leads.filter(l => {
            if (l.status !== status) return false;

            if (filters.assignee && l.assignedTo?.id !== filters.assignee) return false;
            if (filters.source && l.source !== filters.source) return false;

            return true;
        });
    };

    // ...

    const handleQuickAdd = async () => {
        if (!quickAddValue.trim()) return;

        const [firstName, ...lastNameParts] = quickAddValue.trim().split(' ');
        const lastName = lastNameParts.join(' ') || '';

        try {
            await leadService.create({
                firstName,
                lastName: lastName || 'Unknown', // Fallback if only one name provided
                email: 'pending@example.com', // TODO: Make email optional in backend or UI
                phone: '',
                source: 'Quick Add'
            });
            await loadLeads();
            setQuickAddValue('');
            // Keep input open for multiple adds
        } catch (err) {
            console.error('Failed to quick add lead', err);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            const data = await leadService.getAll();
            setLeads(data);
        } catch (error) {
            console.error('Failed to load leads', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (data: any) => {
        try {
            if (leadToEdit) {
                await leadService.update(leadToEdit.id, data);
            } else {
                await leadService.create(data);
            }
            await loadLeads();
            setIsAddModalOpen(false);
            setLeadToEdit(undefined);
        } catch (err) {
            console.error('Failed to save lead', err);
            alert('Failed to save lead');
        }
    };

    const handleDelete = async (lead: Lead) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await leadService.delete(lead.id);
                loadLeads();
                setIsDetailsModalOpen(false);
            } catch (error) {
                console.error('Failed to delete lead', error);
            }
        }
    };

    const handleEdit = (lead: Lead) => {
        setLeadToEdit(lead);
        setIsAddModalOpen(true);
        setIsDetailsModalOpen(false);
    };

    const handleConvert = (lead: Lead) => {
        setSelectedLead(lead);
        setIsConvertModalOpen(true);
        setIsDetailsModalOpen(false);
    };

    const handleBookTrial = (lead: Lead) => {
        setSelectedLead(lead);
        setIsBookTrialModalOpen(true);
        setIsDetailsModalOpen(false);
    };

    const handleViewDetails = (lead: Lead) => {
        setSelectedLead(lead);
        setIsDetailsModalOpen(true);
    };

    const onAddClick = () => {
        setLeadToEdit(undefined);
        setIsAddModalOpen(true);
    };

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as LeadStatus;
        const lead = leads.find(l => l.id === draggableId);

        if (lead) {
            // Optimistic update
            const updatedLeads = leads.map(l =>
                l.id === draggableId ? { ...l, status: newStatus } : l
            );
            setLeads(updatedLeads);

            try {
                await leadService.update(lead.id, { status: newStatus });
                // If moving to converted, maybe prompt for conversion?
                if (newStatus === LeadStatus.CONVERTED) {
                    // Optional: auto-trigger conversion modal?
                    // setSelectedLead({ ...lead, status: newStatus as any });
                    // setIsConvertModalOpen(true);
                }
            } catch (error) {
                console.error('Failed to update lead status', error);
                loadLeads(); // Revert on error
            }
        }
    };

    const uniqueAssignees = Array.from(new Map(leads.filter(l => l.assignedTo).map(l => [l.assignedTo!.id, l.assignedTo!])).values());
    const uniqueSources = Array.from(new Set(leads.map(l => l.source).filter(Boolean)));

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3">
                    <select
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        value={filters.assignee}
                        onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                    >
                        <option value="">All Assignees</option>
                        {uniqueAssignees.map(a => (
                            <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                        ))}
                    </select>

                    <select
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        value={filters.source}
                        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    >
                        <option value="">All Sources</option>
                        {uniqueSources.map(s => (
                            <option key={s as string} value={s as string}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    {(filters.assignee || filters.source) && (
                        <button
                            onClick={() => setFilters({ assignee: '', source: '' })}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 px-3"
                        >
                            Clear Filters
                        </button>
                    )}
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
                    >
                        <Plus size={18} /> Add Lead
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 min-w-max h-full">
                        {LEAD_STATUS_ORDER.map((status) => {
                            const { title, color } = LEAD_STATUS_CONFIG[status];
                            return (
                                <div key={status} className="w-80 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-gray-800 h-full">
                                    <div className={`p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-xl sticky top-0 z-10`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
                                            <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium">
                                                {getColumnLeads(status).length}
                                            </span>
                                        </div>
                                    </div>

                                    <Droppable droppableId={status}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="flex-1 p-3 space-y-3 overflow-y-auto"
                                            >
                                                {getColumnLeads(status).map((lead, index) => (
                                                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={(e) => {
                                                                    if (!(e.target as HTMLElement).closest('button')) {
                                                                        handleViewDetails(lead);
                                                                    }
                                                                }}
                                                                className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group draggable-card cursor-pointer"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                                        {lead.firstName} {lead.lastName}
                                                                    </div>
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <LeadActionMenu
                                                                            lead={lead}
                                                                            onEdit={handleEdit}
                                                                            onDelete={handleDelete}
                                                                            onConvert={handleConvert}
                                                                            onBookTrial={handleBookTrial}
                                                                            vertical
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1 mb-3">
                                                                    {lead.email && (
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                            <Mail size={12} />
                                                                            <span className="truncate">{lead.email}</span>
                                                                        </div>
                                                                    )}
                                                                    {lead.phone && (
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                            <Phone size={12} />
                                                                            <span>{lead.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {lead.assignedTo && (
                                                                        <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                                            <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-[10px]">
                                                                                {lead.assignedTo.firstName?.[0]}{lead.assignedTo.lastName?.[0]}
                                                                            </div>
                                                                            <span>{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                        <Clock size={12} />
                                                                        <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                                                                    </div>

                                                                    {lead.status === LeadStatus.TRIAL_BOOKED && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleConvert(lead);
                                                                            }}
                                                                            className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                                        >
                                                                            Convert to Client
                                                                        </button>
                                                                    )}
                                                                    {lead.source && (
                                                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 text-xs">
                                                                            {lead.source}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {status === LeadStatus.NEW && (
                                                    <div className="p-3 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-gray-50 dark:bg-slate-900">
                                                        {isQuickAdding ? (
                                                            <div className="flex flex-col gap-2">
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    placeholder="Enter lead name (e.g. John Doe)"
                                                                    className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                                    value={quickAddValue}
                                                                    onChange={(e) => setQuickAddValue(e.target.value)}
                                                                    onKeyDown={async (e) => {
                                                                        if (e.key === 'Enter' && quickAddValue.trim()) {
                                                                            e.preventDefault();
                                                                            await handleQuickAdd();
                                                                        } else if (e.key === 'Escape') {
                                                                            setIsQuickAdding(false);
                                                                            setQuickAddValue('');
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => { setIsQuickAdding(false); setQuickAddValue(''); }}
                                                                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={handleQuickAdd}
                                                                        disabled={!quickAddValue.trim()}
                                                                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setIsQuickAdding(true)}
                                                                className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg transition-all"
                                                            >
                                                                <Plus size={16} /> Quick Add
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            <LeadForm
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateLead}
                initialData={leadToEdit || undefined}
                title={leadToEdit ? 'Edit Lead' : 'Add New Lead'}
            />

            <LeadConversionModal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                lead={selectedLead || null}
                onSuccess={() => {
                    loadLeads();
                    setIsConvertModalOpen(false);
                }}
            />
            <LeadBookTrialModal
                open={isBookTrialModalOpen}
                onClose={() => setIsBookTrialModalOpen(false)}
                leadId={selectedLead?.id || ''}
                onSuccess={() => {
                    loadLeads();
                }}
            />
            <LeadDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                lead={selectedLead || null}
                onEdit={handleEdit}
                onConvert={handleConvert}
                onDelete={handleDelete}
            />
        </div >
    );
};

export default LeadKanbanBoard;
