import React, { useState, useEffect } from 'react';
import { Lock, ArrowUpCircle } from 'lucide-react';
import { apiEvents } from '../../services/api';
import { tenantPlanService } from '../../services/tenant-plan.service';
import UpgradeRequestModal from './UpgradeRequestModal';

const LimitReachedModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [errorData, setErrorData] = useState<any>(null);
    const [currentPlanKey, setCurrentPlanKey] = useState<string>('');
    const [loadingPlan, setLoadingPlan] = useState(false);

    useEffect(() => {
        const handleLimitReached = (event: Event) => {
            const customEvent = event as CustomEvent;
            setErrorData(customEvent.detail);
            setIsOpen(true);

            // Proactively fetch current plan info
            fetchCurrentPlan();
        };

        apiEvents.addEventListener('limit-reached', handleLimitReached);

        return () => {
            apiEvents.removeEventListener('limit-reached', handleLimitReached);
        };
    }, []);

    const fetchCurrentPlan = async () => {
        try {
            setLoadingPlan(true);
            const { plan } = await tenantPlanService.getUsage();
            setCurrentPlanKey(plan.key);
        } catch (error) {
            console.error('Failed to fetch current plan', error);
        } finally {
            setLoadingPlan(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setErrorData(null);
    };

    const handleUpgradeClick = () => {
        setShowUpgradeModal(true);
    };

    const handleUpgradeClose = () => {
        setShowUpgradeModal(false);
        // We keep the limit modal open? or close both?
        // Usually if they cancel upgrade, they might want to go back to the limit modal or just close everything.
        // Let's close everything for now to be less annoying.
        setIsOpen(false);
    };

    const handleUpgradeSuccess = () => {
        setShowUpgradeModal(false);
        setIsOpen(false);
        // Optionally show a success toast here or let UpgradeRequestModal handle notifications
    };

    if (showUpgradeModal) {
        return (
            <UpgradeRequestModal
                onClose={handleUpgradeClose}
                onSuccess={handleUpgradeSuccess}
                currentPlanKey={currentPlanKey}
            />
        );
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-500">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Limit Reached
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {errorData?.message || errorData?.error || "You've reached the limit for your current plan."}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleUpgradeClick}
                            disabled={loadingPlan}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <ArrowUpCircle size={20} />
                            {loadingPlan ? 'Loading Plan Options...' : 'Upgrade Plan'}
                        </button>

                        <button
                            onClick={handleClose}
                            className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LimitReachedModal;
