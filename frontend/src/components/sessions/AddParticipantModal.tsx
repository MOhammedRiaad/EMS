import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { clientsService, type Client } from '../../services/clients.service';
import { Search } from 'lucide-react';

interface AddParticipantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (clientId: string) => Promise<void>;
    existingParticipantIds: Set<string>;
}

const AddParticipantModal: React.FC<AddParticipantModalProps> = ({ isOpen, onClose, onAdd, existingParticipantIds }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadClients();
        }
    }, [isOpen]);

    const loadClients = async () => {
        setLoading(true);
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (clientId: string) => {
        setAddingId(clientId);
        setError(null);
        try {
            await onAdd(clientId);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add participant');
        } finally {
            setAddingId(null);
        }
    };

    const filteredClients = clients
        .filter(c => !existingParticipantIds.has(c.id))
        .filter(c => {
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase()) || c.email?.toLowerCase().includes(searchQuery.toLowerCase());
        });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Participant">
            <div className="p-4 min-h-[300px]">
                <div className="flex items-center mb-4 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 transition-colors">
                    <Search size={18} className="text-gray-400 dark:text-gray-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        autoFocus
                    />
                </div>

                {error && <div className="text-red-500 dark:text-red-400 mb-4 text-sm">{error}</div>}

                {loading ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">Loading clients...</div>
                ) : (
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                        {filteredClients.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleAdd(c.id)}
                                disabled={addingId !== null}
                                className={`
                                    text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 
                                    bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 
                                    flex justify-between items-center transition-all
                                    ${addingId === c.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{c.firstName} {c.lastName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{c.email || 'No email'}</div>
                                </div>
                                {addingId === c.id && <span className="text-sm text-blue-500">Adding...</span>}
                            </button>
                        ))}
                        {filteredClients.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                                No clients found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AddParticipantModal;
