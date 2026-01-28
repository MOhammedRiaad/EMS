import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { leadService, type Lead } from '../../../../services/lead.service';
import { Plus, Phone, Mail, Clock } from 'lucide-react';
import LeadForm from './LeadForm';
import LeadActionMenu from './LeadActionMenu';
import LeadConversionModal from './LeadConversionModal';

import LeadDetailsModal from './LeadDetailsModal';

const COLUMNS = {
    new: { title: 'New Leads', color: 'bg-blue-500' },
    contacted: { title: 'Contacted', color: 'bg-yellow-500' },
    trial_booked: { title: 'Trial Booked', color: 'bg-purple-500' },
    converted: { title: 'Converted', color: 'bg-green-500' },
    lost: { title: 'Lost', color: 'bg-gray-500' }
};

const LeadKanbanBoard: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
    const [leadToEdit, setLeadToEdit] = useState<Lead | undefined>(undefined);

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

        const newStatus = destination.droppableId;
        const lead = leads.find(l => l.id === draggableId);

        if (lead) {
            // Optimistic update
            const updatedLeads = leads.map(l =>
                l.id === draggableId ? { ...l, status: newStatus as any } : l
            );
            setLeads(updatedLeads);

            try {
                await leadService.update(lead.id, { status: newStatus });
                // If moving to converted, maybe prompt for conversion?
                if (newStatus === 'converted') {
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

    const getColumnLeads = (status: string) => leads.filter(l => l.status === status);

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-end mb-4">
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
                >
                    <Plus size={18} /> Add Lead
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 min-w-max h-full">
                        {Object.entries(COLUMNS).map(([status, { title, color }]) => (
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

                                                                {lead.status === 'trial_booked' && (
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

                                            {status === 'new' && (
                                                <div className="p-3 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-gray-50 dark:bg-slate-900">
                                                    <button
                                                        onClick={onAddClick}
                                                        className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg transition-all"
                                                    >
                                                        <Plus size={16} /> Add Lead
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
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
