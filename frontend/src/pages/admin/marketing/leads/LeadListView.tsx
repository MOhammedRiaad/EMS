import React, { useState, useEffect } from 'react';
import { leadService, type Lead } from '../../../../services/lead.service';
import { Search, Plus } from 'lucide-react';
import LeadForm from './LeadForm';
import LeadActionMenu from './LeadActionMenu';
import LeadConversionModal from './LeadConversionModal';
import LeadDetailsModal from './LeadDetailsModal';

const LeadListView: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
    const [leadToEdit, setLeadToEdit] = useState<Lead | undefined>(undefined);

    useEffect(() => {
        loadLeads();
    }, [search, statusFilter]);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await leadService.getAll({
                search: search || undefined,
                status: statusFilter || undefined
            });
            setLeads(data);
        } catch (err) {
            console.error('Failed to load leads', err);
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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="trial_booked">Trial Booked</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                    <Plus size={18} /> Add Lead
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Created</th>
                            <th className="px-6 py-3">Assigned To</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading leads...</td>
                            </tr>
                        ) : leads.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No leads found.</td>
                            </tr>
                        ) : (
                            leads.map(lead => (
                                <tr
                                    key={lead.id}
                                    onClick={() => handleViewDetails(lead)}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white">{lead.firstName} {lead.lastName}</div>
                                        <div className="text-gray-500 text-xs">{lead.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                lead.status === 'converted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                    lead.status === 'lost' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                            }`}>
                                            {lead.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {lead.source || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                                            <LeadActionMenu
                                                lead={lead}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onConvert={handleConvert}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Simplified) */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
                <span>Showing {leads.length} results</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" disabled>Previous</button>
                    <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" disabled>Next</button>
                </div>
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
        </div>
    );
};

export default LeadListView;
