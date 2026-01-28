import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { sessionsService, type Session } from '../../services/sessions.service';
import ParticipantList from '../../components/sessions/ParticipantList';
import AddParticipantModal from '../../components/sessions/AddParticipantModal';
import { Users, Clock, MapPin, User, Loader2, CheckCircle, XCircle, Monitor, Calendar } from 'lucide-react';
import { saveAs } from 'file-saver';
import { api } from '../../services/api';

interface SessionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session | null;
    onSessionUpdated: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ isOpen, onClose, session, onSessionUpdated }) => {
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen && session) {
            loadSessionDetails(session.id);
        } else {
            setCurrentSession(null);
        }
    }, [isOpen, session]);

    const loadSessionDetails = async (id: string) => {
        setLoading(true);
        try {
            const data = await sessionsService.getById(id);
            setCurrentSession(data);
        } catch (err) {
            console.error('Failed to load session details', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddParticipant = async (clientId: string) => {
        if (!currentSession) return;
        try {
            await sessionsService.addParticipant(currentSession.id, clientId);
            await loadSessionDetails(currentSession.id);
            onSessionUpdated();
        } catch (err) {
            throw err;
        }
    };

    const handleRemoveParticipant = async (clientId: string) => {
        if (!currentSession) return;
        try {
            await sessionsService.removeParticipant(currentSession.id, clientId);
            await loadSessionDetails(currentSession.id);
            onSessionUpdated();
        } catch (err) {
            console.error(err);
            alert('Failed to remove participant');
        }
    };

    const handleUpdateStatus = async (clientId: string, status: string) => {
        if (!currentSession) return;
        try {
            await sessionsService.updateParticipantStatus(currentSession.id, clientId, status);
            await loadSessionDetails(currentSession.id);
            onSessionUpdated();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const handleAction = async (action: 'completed' | 'cancelled') => {
        if (!currentSession) return;
        if (!window.confirm(`Are you sure you want to mark this session as ${action}?`)) return;

        setLoading(true);
        try {
            await sessionsService.updateStatus(currentSession.id, action);
            await loadSessionDetails(currentSession.id);
            onSessionUpdated();
            if (action === 'cancelled') onClose(); // Close on cancel? Or stay? Stay to see status.
        } catch (err) {
            console.error(err);
            alert(`Failed to mark session as ${action}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadIcs = async () => {
        if (!currentSession) return;
        try {
            const response = await api.get(`/calendar/session/${currentSession.id}.ics`, {
                responseType: 'blob'
            });
            saveAs(response.data, 'session.ics');
        } catch (err) {
            console.error('Failed to download calendar file', err);
            alert('Failed to download calendar file');
        }
    };

    if (!session) return null;

    const displaySession = currentSession || session;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Session Details" maxWidth="max-w-2xl">
                <div className="flex flex-col h-full">
                    <div className="min-w-[600px]">
                        {loading && !currentSession ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                            {displaySession.type === 'group' ? 'Group Session' : 'Individual Session'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                                                {displaySession.status}
                                            </span>
                                            <span>•</span>
                                            <span>{displaySession.participants?.length || 0} Participants</span>
                                        </div>
                                    </div>
                                    {displaySession.status === 'scheduled' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleDownloadIcs}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-md text-sm font-medium transition-colors"
                                                title="Add to Calendar"
                                            >
                                                <Calendar size={16} />
                                                <span className="hidden sm:inline">Add to Calendar</span>
                                            </button>
                                            <button
                                                onClick={() => handleAction('completed')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
                                            >
                                                <CheckCircle size={16} />
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => handleAction('cancelled')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                                            >
                                                <XCircle size={16} />
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Time</div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100 flex flex-wrap items-center gap-2">
                                            <Clock size={16} className="text-blue-500 shrink-0" />
                                            <span className="whitespace-nowrap">
                                                {new Date(displaySession.startTime).toLocaleDateString()}
                                            </span>
                                            <span className="text-gray-400 hidden sm:inline">|</span>
                                            <span className="whitespace-nowrap">
                                                {new Date(displaySession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(displaySession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Location</div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <MapPin size={16} className="text-blue-500" />
                                            <span>{displaySession.studio?.name}</span>
                                            <span className="text-gray-400">/</span>
                                            <span>{displaySession.room?.name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Coach</div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <User size={16} className="text-blue-500" />
                                            {displaySession.coach?.user ? `${displaySession.coach.user.firstName} ${displaySession.coach.user.lastName}` : 'Unassigned'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                                            {displaySession.type === 'group' ? 'Capacity' : 'Client'}
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            {displaySession.type === 'group' ? (
                                                <>
                                                    <Users size={16} className="text-blue-500" />
                                                    {displaySession.participants?.length || 0} / {displaySession.capacity || '-'}
                                                </>
                                            ) : (
                                                <>
                                                    <User size={16} className="text-blue-500" />
                                                    {displaySession.client ? `${displaySession.client.firstName} ${displaySession.client.lastName}` : 'Unknown Client'}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {displaySession.programType && (
                                        <div className="space-y-1">
                                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Program</div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                <Monitor size={16} className="text-blue-500" />
                                                <span className="capitalize">{displaySession.programType.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Participants Section (Group Only) */}
                                {displaySession.type === 'group' && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Participants</h4>
                                            {displaySession.status === 'scheduled' && (
                                                <button
                                                    onClick={() => setIsAddModalOpen(true)}
                                                    disabled={!!(displaySession.participants && displaySession.capacity && displaySession.participants.length >= displaySession.capacity)}
                                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    + Add Participant
                                                </button>
                                            )}
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <ParticipantList
                                                participants={displaySession.participants || []}
                                                onRemove={handleRemoveParticipant}
                                                onUpdateStatus={handleUpdateStatus}
                                                canEdit={displaySession.status === 'scheduled'}
                                                hideHeader={true}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <AddParticipantModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddParticipant}
                existingParticipantIds={new Set((displaySession.participants || []).map(p => p.clientId))}
            />
        </>
    );
};

export default SessionDetailsModal;
