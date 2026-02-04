import React, { useEffect, useState } from 'react';
import { Mail, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ownerPortalService } from '../../../services/owner-portal.service';

interface Broadcast {
    id: string;
    subject: string;
    body: string;
    type: 'EMAIL' | 'SMS';
    targetAudience: string;
    status: string;
    sentAt: string | null;
    stats: {
        totalRecipients: number;
        successCount: number;
        failureCount: number;
    } | null;
}

const BroadcastHistory: React.FC = () => {
    const [history, setHistory] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await ownerPortalService.getBroadcastHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SENT': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1"><CheckCircle size={12} /> Sent</span>;
            case 'FAILED': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1"><XCircle size={12} /> Failed</span>;
            case 'SENDING': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 flex items-center gap-1"><Clock size={12} /> Sending</span>;
            default: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1"><AlertCircle size={12} /> {status}</span>;
        }
    };

    if (loading) return <div className="text-center py-8 text-gray-500">Loading history...</div>;
    if (history.length === 0) return <div className="text-center py-8 text-gray-500">No broadcast history found.</div>;

    return (
        <div className="space-y-4">
            {history.map(broadcast => (
                <div key={broadcast.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${broadcast.type === 'EMAIL' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {broadcast.type === 'EMAIL' ? <Mail size={18} /> : <MessageSquare size={18} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{broadcast.subject || 'No Subject'}</h4>
                                <p className="text-xs text-gray-500">To: {broadcast.targetAudience.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {getStatusBadge(broadcast.status)}
                            <p className="text-xs text-gray-400 mt-1">
                                {broadcast.sentAt ? new Date(broadcast.sentAt).toLocaleDateString() : 'Draft'}
                            </p>
                        </div>
                    </div>

                    {broadcast.stats && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex gap-6 text-sm">
                            <div>
                                <span className="text-gray-500 mr-2">Recipients:</span>
                                <span className="font-medium dark:text-white">{broadcast.stats.totalRecipients}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 mr-2">Success:</span>
                                <span className="font-medium text-green-600">{broadcast.stats.successCount}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 mr-2">Failed:</span>
                                <span className="font-medium text-red-600">{broadcast.stats.failureCount}</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default BroadcastHistory;
