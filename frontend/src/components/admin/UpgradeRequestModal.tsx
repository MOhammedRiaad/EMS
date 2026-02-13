import React, { useState, useEffect } from 'react';
import { X, Check, Shield, AlertCircle } from 'lucide-react';
import { tenantPlanService } from '../../services/tenant-plan.service';
import type { PlanComparison } from '../../services/tenant-plan.service';

interface UpgradeRequestModalProps {
    onClose: () => void;
    onSuccess: () => void;
    currentPlanKey: string;
}

const UpgradeRequestModal: React.FC<UpgradeRequestModalProps> = ({ onClose, onSuccess, currentPlanKey }) => {
    const [plans, setPlans] = useState<PlanComparison[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [compatibility, setCompatibility] = useState<{ compatible: boolean; violations: string[] } | null>(null);
    const [checkingCompatibility, setCheckingCompatibility] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await tenantPlanService.getPlans();
                setPlans(data);
                // Pre-select the next tier if available, otherwise the first non-current one
                const currentIdx = data.findIndex(p => p.key === currentPlanKey);
                if (currentIdx !== -1 && currentIdx < data.length - 1) {
                    setSelectedPlan(data[currentIdx + 1].key);
                } else if (data.length > 0) {
                    setSelectedPlan(data[0].key);
                }
            } catch (err) {
                console.error('Failed to load plans', err);
                setError('Failed to load available plans.');
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();

    }, [currentPlanKey]);

    useEffect(() => {
        const checkCompatibility = async () => {
            if (!selectedPlan || selectedPlan === currentPlanKey) {
                setCompatibility(null);
                return;
            }

            setCheckingCompatibility(true);
            try {
                const result = await tenantPlanService.checkDowngrade(selectedPlan);
                setCompatibility(result);
            } catch (err) {
                console.error('Failed to check compatibility', err);
                // Don't block UI on check failure, but maybe warn?
            } finally {
                setCheckingCompatibility(false);
            }
        };

        checkCompatibility();
    }, [selectedPlan, currentPlanKey]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await tenantPlanService.submitUpgradeRequest(selectedPlan, reason);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-start shrink-0">
                    <div className="text-white">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="h-6 w-6" />
                            Request Plan Upgrade
                        </h2>
                        <p className="text-blue-100 mt-1">Unlock more resources and features for your studio.</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {compatibility && !compatibility.compatible && (
                        <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2 font-semibold">
                                <AlertCircle size={18} />
                                <span>Plan Incompatible</span>
                            </div>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-1">
                                {compatibility.violations.map((v, i) => (
                                    <li key={i}>{v}</li>
                                ))}
                            </ul>
                            <p className="text-xs mt-3 text-orange-700">
                                You must reduce your usage below these limits before switching to this plan.
                            </p>
                        </div>
                    )}

                    <form id="upgrade-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Plan Selection */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select Desired Plan
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.key}
                                        onClick={() => setSelectedPlan(plan.key)}
                                        className={`
                                            cursor-pointer rounded-xl border-2 p-4 transition-all relative
                                            ${selectedPlan === plan.key
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}
                                            ${plan.key === currentPlanKey ? 'opacity-60 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                            {plan.key === currentPlanKey && (
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">Current</span>
                                            )}
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600 mb-2">
                                            ${plan.price}<span className="text-sm text-gray-500 font-normal">/mo</span>
                                        </div>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• {plan.limits.clients === -1 ? 'Unlimited' : plan.limits.clients} Clients</li>
                                            <li>• {plan.limits.sessionsPerMonth === -1 ? 'Unlimited' : plan.limits.sessionsPerMonth} Sessions/mo</li>
                                            <li>• {plan.limits.coaches} Coaches</li>
                                        </ul>

                                        {selectedPlan === plan.key && (
                                            <div className="absolute top-2 right-2 text-blue-600 bg-white rounded-full p-1 shadow-sm">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Why do you need this upgrade?
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                required
                                placeholder="E.g., We're hitting our client limit and need to grow..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        form="upgrade-form"
                        disabled={submitting || !selectedPlan || (compatibility !== null && !compatibility.compatible)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default UpgradeRequestModal;
