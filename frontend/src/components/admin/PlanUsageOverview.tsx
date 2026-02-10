import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, Mail, MessageSquare, Database, ArrowUpCircle, Clock, AlertTriangle } from 'lucide-react';
import { tenantPlanService } from '../../services/tenant-plan.service';
import type { UsageSnapshot, Plan, UpgradeRequest } from '../../services/tenant-plan.service';
import UpgradeRequestModal from './UpgradeRequestModal';

const PlanUsageOverview: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [usageData, setUsageData] = useState<UsageSnapshot | null>(null);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [pendingRequest, setPendingRequest] = useState<UpgradeRequest | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [requestHistory, setRequestHistory] = useState<UpgradeRequest[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const fetchData = async () => {
        try {
            const data = await tenantPlanService.getUsage();
            setUsageData(data.usage);
            setCurrentPlan(data.plan);

            const pending = await tenantPlanService.getPendingRequest();
            setPendingRequest(pending);

            const history = await tenantPlanService.getRequestHistory();
            setRequestHistory(history);
        } catch (err) {
            console.error('Failed to fetch usage data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpgradeSuccess = () => {
        fetchData();
        // Maybe show a toast notification here
    };

    const handleCancelRequest = async () => {
        if (!pendingRequest) return;
        try {
            await tenantPlanService.cancelRequest(pendingRequest.id);
            fetchData();
        } catch (err) {
            console.error('Failed to cancel request', err);
        }
    };

    if (loading) {
        return <div className="h-48 flex items-center justify-center text-gray-400">Loading plan details...</div>;
    }

    if (!usageData || !currentPlan) return null;

    const renderProgressBar = (
        label: string,
        current: number,
        limit: number,
        percentage: number,
        icon: React.ReactNode,
        colorClass = 'bg-blue-600'
    ) => {
        const isUnlimited = limit === -1;
        const displayLimit = isUnlimited ? '∞' : limit;
        const percentValue = isUnlimited ? 0 : Math.min(percentage, 100);

        let statusColor = colorClass;
        if (!isUnlimited) {
            if (percentage >= 100) statusColor = 'bg-red-500';
            else if (percentage >= 80) statusColor = 'bg-yellow-500';
        }

        return (
            <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {icon}
                        {label}
                    </div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {current} / {displayLimit}
                    </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${statusColor}`}
                        style={{ width: `${isUnlimited ? 100 : percentValue}%`, opacity: isUnlimited ? 0.3 : 1 }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <BarChart3 className="text-blue-600" size={24} />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plan & Usage</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Current Plan:</span>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-wide">
                                {currentPlan.name}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {pendingRequest ? (
                        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                            <Clock size={16} />
                            <span>Upgrade Requested</span>
                            <button
                                onClick={handleCancelRequest}
                                className="text-xs underline hover:no-underline font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            <ArrowUpCircle size={16} />
                            Upgrade Plan
                        </button>
                    )}
                </div>
            </div>

            {/* Usage Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {renderProgressBar(
                    'Active Clients',
                    usageData.clients.current,
                    usageData.clients.limit,
                    usageData.clients.percentage,
                    <Users size={14} className="text-gray-400" />
                )}
                {renderProgressBar(
                    'Monthly Sessions',
                    usageData.sessionsThisMonth.current,
                    usageData.sessionsThisMonth.limit,
                    usageData.sessionsThisMonth.percentage,
                    <Calendar size={14} className="text-gray-400" />
                )}
                {renderProgressBar(
                    'Active Coaches',
                    usageData.coaches.current,
                    usageData.coaches.limit,
                    usageData.coaches.percentage,
                    <Users size={14} className="text-gray-400" />
                )}
                {renderProgressBar(
                    'Monthly Emails',
                    usageData.emailThisMonth.current,
                    usageData.emailThisMonth.limit,
                    usageData.emailThisMonth.percentage,
                    <Mail size={14} className="text-gray-400" />
                )}
                {renderProgressBar(
                    'Monthly SMS',
                    usageData.smsThisMonth.current,
                    usageData.smsThisMonth.limit,
                    usageData.smsThisMonth.percentage,
                    <MessageSquare size={14} className="text-gray-400" />
                )}
                {renderProgressBar(
                    'Storage (GB)',
                    Number(usageData.storageGB.current.toFixed(2)),
                    usageData.storageGB.limit,
                    usageData.storageGB.percentage,
                    <Database size={14} className="text-gray-400" />
                )}
            </div>

            {/* Blocked Status Warning */}
            {usageData.isBlocked && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 mt-0.5" size={18} />
                    <div>
                        <h4 className="font-bold text-red-800 text-sm">Account Limits Reached</h4>
                        <p className="text-sm text-red-700 mt-1">
                            {usageData.blockReason || 'Some actions are restricted because you have exceeded your plan limits.'}
                            Please upgrade your plan to continue growing.
                        </p>
                    </div>
                </div>
            )}

            {/* Request History Link */}
            {requestHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-center md:text-left">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        {showHistory ? 'Hide' : 'View'} Upgrade Request History ({requestHistory.length})
                    </button>

                    {showHistory && (
                        <div className="mt-3 space-y-2">
                            {requestHistory.map(req => (
                                <div key={req.id} className="text-xs bg-gray-50 dark:bg-slate-800 p-2 rounded flex justify-between items-center text-gray-600 dark:text-gray-400">
                                    <span>
                                        {new Date(req.requestedAt).toLocaleDateString()} -
                                        Requested <strong>{req.requestedPlan}</strong>
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded capitalize ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-200 text-gray-700'
                                        }`}>
                                        {req.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upgrade Modal */}
            {showUpgradeModal && currentPlan && (
                <UpgradeRequestModal
                    onClose={() => setShowUpgradeModal(false)}
                    onSuccess={handleUpgradeSuccess}
                    currentPlanKey={currentPlan.key}
                />
            )}
        </div>
    );
};

export default PlanUsageOverview;
