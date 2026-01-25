import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { parqService, type ParqResponse } from '../../../services/parq.service';
import ParqModal from '../../compliance/ParqModal';
import { format } from 'date-fns';

interface ClientParqTabProps {
    clientId: string;
}

const ClientParqTab: React.FC<ClientParqTabProps> = ({ clientId }) => {
    const [parq, setParq] = useState<ParqResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadParq();
    }, [clientId]);

    const loadParq = async () => {
        try {
            const data = await parqService.getLatest(clientId);
            setParq(data);
        } catch (err) {
            console.error('Failed to load PAR-Q', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleted = () => {
        setShowModal(false);
        loadParq();
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading compliance data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Activity size={20} className="text-blue-500" />
                    Physical Activity Readiness
                </h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    {parq ? 'Update PAR-Q' : 'Complete PAR-Q'}
                </button>
            </div>

            {!parq ? (
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-6 text-center">
                    <AlertTriangle className="mx-auto text-orange-500 mb-2" size={32} />
                    <h4 className="font-bold text-orange-700 dark:text-orange-400">No PAR-Q on file</h4>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                        This client has not completed the Physical Activity Readiness Questionnaire.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                                {parq.hasRisk ? (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-full">
                                        Physician Clearance Required
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full">
                                        Cleared for Activity
                                    </span>
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-gray-100">
                                PAR-Q Signed on {format(new Date(parq.signedAt), 'MMMM d, yyyy')}
                            </h4>
                        </div>
                        <CheckCircle className="text-green-500" size={24} />
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-slate-950/50">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                            Responses
                        </h5>
                        <div className="space-y-3">
                            {Object.entries(parq.responses).map(([key, value], index) => (
                                <div key={key} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Question {index + 1}</span>
                                    <span className={`font-medium ${value ? 'text-red-600' : 'text-green-600'}`}>
                                        {value ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <ParqModal
                    clientId={clientId}
                    onCompleted={handleCompleted}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default ClientParqTab;
