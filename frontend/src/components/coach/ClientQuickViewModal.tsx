import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, Activity, Loader2 } from 'lucide-react';
import { coachPortalService } from '../../services/coach-portal.service';

interface ClientQuickViewModalProps {
    clientId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface ClientData {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    profileImage?: string;
    notes?: string;
    remainingSessions?: number;
    healthConditions?: string[];
    goals?: string[];
}

const ClientQuickViewModal: React.FC<ClientQuickViewModalProps> = ({ clientId, isOpen, onClose }) => {
    const [client, setClient] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && clientId) {
            loadClient();
        }
    }, [isOpen, clientId]);

    const loadClient = async () => {
        try {
            setLoading(true);
            const data = await coachPortalService.getClientDetails(clientId);
            setClient(data);
        } catch (err) {
            console.error('Failed to load client:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Client Quick View</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : client ? (
                        <div className="space-y-4">
                            {/* Profile Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    {client.profileImage ? (
                                        <img
                                            src={client.profileImage}
                                            alt={`${client.firstName} ${client.lastName}`}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {client.firstName} {client.lastName}
                                    </h3>
                                    {client.gender && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                            {client.gender}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail size={14} className="text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone size={14} className="text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">{client.phone}</span>
                                    </div>
                                )}
                                {client.dateOfBirth && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {new Date(client.dateOfBirth).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Sessions Remaining */}
                            {client.remainingSessions !== undefined && (
                                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Sessions Remaining</span>
                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {client.remainingSessions}
                                    </span>
                                </div>
                            )}

                            {/* Health Conditions */}
                            {client.healthConditions && client.healthConditions.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                        <Activity size={14} />
                                        Health Conditions
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {client.healthConditions.map((condition, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded-full"
                                            >
                                                {condition}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Goals */}
                            {client.goals && client.goals.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Goals</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {client.goals.map((goal, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full"
                                            >
                                                {goal}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {client.notes && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        {client.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Client not found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientQuickViewModal;
