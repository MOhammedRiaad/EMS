import React, { useState } from 'react';
import type { SessionParticipant } from '../../services/sessions.service';
import { Trash2 } from 'lucide-react';

interface ParticipantListProps {
    participants: SessionParticipant[];
    onUpdateStatus: (clientId: string, status: string) => Promise<void>;
    onRemove: (clientId: string) => Promise<void>;
    canEdit: boolean;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, onUpdateStatus, onRemove, canEdit }) => {
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const handleStatusChange = async (participant: SessionParticipant, newStatus: string) => {
        if (loadingIds.has(participant.clientId)) return;
        setLoadingIds(prev => new Set(prev).add(participant.clientId));
        try {
            await onUpdateStatus(participant.clientId, newStatus);
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(participant.clientId);
                return next;
            });
        }
    };

    const handleRemove = async (participant: SessionParticipant) => {
        if (!confirm('Are you sure you want to remove this participant?')) return;
        if (loadingIds.has(participant.clientId)) return;
        setLoadingIds(prev => new Set(prev).add(participant.clientId));
        try {
            await onRemove(participant.clientId);
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(participant.clientId);
                return next;
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-500';
            case 'no_show': return 'text-amber-500';
            case 'cancelled': return 'text-red-500';
            default: return 'text-blue-500';
        }
    };

    const getStatusFormatted = (status: string) => {
        return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className="mt-4">
            <h4 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">Participants ({participants.length})</h4>
            <div className="flex flex-col gap-2">
                {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 transition-colors">
                        <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                {p.client ? `${p.client.firstName} ${p.client.lastName}` : 'Unknown Client'}
                            </div>
                            <div className={`text-sm ${getStatusColor(p.status)} font-medium`}>
                                {getStatusFormatted(p.status)}
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex gap-2 items-center">
                                <select
                                    value={p.status}
                                    onChange={(e) => handleStatusChange(p, e.target.value)}
                                    disabled={loadingIds.has(p.clientId)}
                                    className="p-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="no_show">No Show</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button
                                    onClick={() => handleRemove(p)}
                                    disabled={loadingIds.has(p.clientId)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Remove Participant"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {participants.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No participants yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantList;
