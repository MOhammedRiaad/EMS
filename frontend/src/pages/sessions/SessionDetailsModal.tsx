import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { sessionsService, type Session } from '../../services/sessions.service';
import ParticipantList from '../../components/sessions/ParticipantList';
import AddParticipantModal from '../../components/sessions/AddParticipantModal';
import { Users, Clock, MapPin, User, Loader2 } from 'lucide-react';

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

    if (!session) return null;

    const displaySession = currentSession || session;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Session Details">
                <div className="p-6 min-w-[500px]">
                    {loading && !currentSession ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-start gap-2">
                                    <Clock size={16} className="text-gray-500 dark:text-gray-400 mt-1" />
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {new Date(displaySession.startTime).toLocaleDateString()}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400">
                                            {new Date(displaySession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(displaySession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-gray-500 dark:text-gray-400 mt-1" />
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{displaySession.studio?.name}</div>
                                        <div className="text-gray-500 dark:text-gray-400">{displaySession.room?.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <User size={16} className="text-gray-500 dark:text-gray-400 mt-1" />
                                    <div className="text-sm">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Coach</div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {displaySession.coach?.user ? `${displaySession.coach.user.firstName} ${displaySession.coach.user.lastName}` : 'Unassigned'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Users size={16} className="text-gray-500 dark:text-gray-400 mt-1" />
                                    <div className="text-sm">
                                        <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Type</div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                            {displaySession.type}
                                            {displaySession.type === 'group' && ` (${displaySession.participants?.length || 0}/${displaySession.capacity || '-'})`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                {displaySession.type === 'group' ? (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Participants</h3>
                                            <button
                                                onClick={() => setIsAddModalOpen(true)}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!!(displaySession.participants && displaySession.capacity && displaySession.participants.length >= displaySession.capacity)}
                                            >
                                                Add Participant
                                            </button>
                                        </div>
                                        <ParticipantList
                                            participants={displaySession.participants || []}
                                            onRemove={handleRemoveParticipant}
                                            onUpdateStatus={handleUpdateStatus}
                                            canEdit={true}
                                        />
                                    </>
                                ) : (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Client</h3>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                                <User size={18} />
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {displaySession.client ? `${displaySession.client.firstName} ${displaySession.client.lastName}` : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
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
