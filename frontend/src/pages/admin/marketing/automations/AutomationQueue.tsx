import React, { useState, useEffect } from 'react';
import { automationService, type AutomationExecution } from '../../../../services/automation.service';
import { Clock, CheckCircle, AlertOctagon, XCircle, RotateCw } from 'lucide-react';
import { format } from 'date-fns';

const AutomationQueue: React.FC = () => {
    const [executions, setExecutions] = useState<AutomationExecution[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExecutions = async () => {
        setLoading(true);
        try {
            const data = await automationService.getExecutions();
            setExecutions(data);
        } catch (error) {
            console.error('Failed to fetch executions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExecutions();
        const interval = setInterval(fetchExecutions, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="text-yellow-500" size={18} />;
            case 'completed': return <CheckCircle className="text-green-500" size={18} />;
            case 'failed': return <AlertOctagon className="text-red-500" size={18} />;
            case 'cancelled': return <XCircle className="text-gray-500" size={18} />;
            default: return <RotateCw className="text-blue-500" size={18} />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }[status] || 'bg-blue-100 text-blue-800';

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    if (loading && executions.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading queue...</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Execution Queue</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monitor active and past automation runs</p>
                </div>
                <button
                    onClick={fetchExecutions}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RotateCw size={18} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Rule</th>
                            <th className="px-6 py-3">Target Entity</th>
                            <th className="px-6 py-3">Progress</th>
                            <th className="px-6 py-3">Next Run</th>
                            <th className="px-6 py-3">Started</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {executions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No executions found.
                                </td>
                            </tr>
                        ) : (
                            executions.map((exec) => (
                                <tr key={exec.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(exec.status)}
                                            {getStatusBadge(exec.status)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                        {exec.rule?.name || 'Deleted Rule'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
                                            {exec.entityId}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        Step {exec.currentStepIndex + 1}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {exec.status === 'pending'
                                            ? format(new Date(exec.nextRunAt), 'MMM d, h:mm a')
                                            : '-'
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {format(new Date(exec.createdAt), 'MMM d, h:mm a')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AutomationQueue;
