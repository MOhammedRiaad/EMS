import React, { useEffect, useState } from 'react';
import {
    Check,
    X,
    Clock,
    MessageSquare,
    ArrowRight
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { UpgradeRequest } from '../../services/owner-portal.service';

const OwnerUpgradeRequests: React.FC = () => {
    const [requests, setRequests] = useState<UpgradeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionNote, setActionNote] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await ownerPortalService.getPendingUpgradeRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load upgrade requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleActionClick = (request: UpgradeRequest, type: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setActionType(type);
        setActionNote('');
    };

    const submitAction = async () => {
        if (!selectedRequest || !actionType) return;

        setProcessingId(selectedRequest.id);
        try {
            if (actionType === 'approve') {
                await ownerPortalService.approveUpgrade(selectedRequest.id, actionNote);
            } else {
                await ownerPortalService.rejectUpgrade(selectedRequest.id, actionNote);
            }
            // Refresh list
            await loadRequests();
            setSelectedRequest(null);
            setActionType(null);
        } catch (error) {
            console.error(`Failed to ${actionType} request`, error);
            alert(`Failed to ${actionType} request. Please try again.`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan Upgrade Requests</h1>
                    <p className="text-gray-500 dark:text-gray-400">Review and approve tenant plan changes</p>
                </div>
                <button
                    onClick={loadRequests}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                        <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Caught Up!</h3>
                        <p className="text-gray-500">There are no pending upgrade requests at this time.</p>
                    </div>
                ) : (
                    requests.map(request => (
                        <div key={request.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {request.tenantName}
                                            <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                ID: {request.tenantId.substring(0, 8)}...
                                            </span>
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <Clock size={14} />
                                            Requested on {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Current</div>
                                            <div className="font-medium text-gray-700 dark:text-gray-300">{request.currentPlan}</div>
                                        </div>
                                        <ArrowRight className="text-gray-400" size={20} />
                                        <div className="text-right">
                                            <div className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Requested</div>
                                            <div className="font-bold text-blue-600">{request.requestedPlan}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <MessageSquare size={14} /> Reason for Upgrade
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                                        "{request.reason}"
                                    </p>
                                    {request.requesterName && (
                                        <p className="text-xs text-gray-500 mt-2 text-right">
                                            — Requested by {request.requesterName}
                                        </p>
                                    )}
                                </div>

                                {/* Action Area */}
                                {selectedRequest?.id === request.id ? (
                                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4 animate-fade-in">
                                        <label
                                            htmlFor="action-note"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                        >
                                            {actionType === 'approve' ? 'Optional Approval Note:' : 'Rejection Reason (Required):'}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                id="action-note"
                                                type="text"
                                                value={actionNote}
                                                onChange={(e) => setActionNote(e.target.value)}
                                                placeholder={actionType === 'approve' ? "E.g., Approved as per conversation" : "E.g., Need to verify payment info first"}
                                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button
                                                onClick={submitAction}
                                                disabled={!!processingId || (actionType === 'reject' && !actionNote)}
                                                className={`
                                                    px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2
                                                    ${actionType === 'approve'
                                                        ? 'bg-green-600 hover:bg-green-700'
                                                        : 'bg-red-600 hover:bg-red-700'}
                                                    disabled:opacity-50 disabled:cursor-not-allowed
                                                `}
                                            >
                                                {processingId ? 'Processing...' : (
                                                    <>
                                                        {actionType === 'approve' ? <Check size={16} /> : <X size={16} />}
                                                        Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setSelectedRequest(null); setActionType(null); }}
                                                className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            onClick={() => handleActionClick(request, 'reject')}
                                            className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors flex items-center gap-2"
                                        >
                                            <X size={16} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleActionClick(request, 'approve')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md shadow-green-500/20 transition-colors flex items-center gap-2"
                                        >
                                            <Check size={16} /> Approve Upgrade
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OwnerUpgradeRequests;
