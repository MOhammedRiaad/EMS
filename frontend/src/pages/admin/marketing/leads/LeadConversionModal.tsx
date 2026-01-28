import React, { useState } from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { type Lead, leadService } from '../../../../services/lead.service';

interface LeadConversionModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onSuccess: () => void;
}

const LeadConversionModal: React.FC<LeadConversionModalProps> = ({ isOpen, onClose, lead, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !lead) return null;

    const handleConvert = async () => {
        setLoading(true);
        setError(null);
        try {
            await leadService.convertToClient(lead.id);
            onSuccess();
            onClose();
            // Optional: navigate to client profile 
            // navigate(/admin/clients/${newClientId});
        } catch (err: any) {
            setError(err.message || 'Failed to convert lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800 animate-fade-in-up">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={32} />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Convert to Client?</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        This will create a new client account for <span className="font-semibold text-gray-700 dark:text-gray-300">{lead.firstName} {lead.lastName}</span> and mark this lead as converted.
                    </p>

                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 justify-center">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConvert}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? 'Converting...' : 'Confirm Conversion'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadConversionModal;
