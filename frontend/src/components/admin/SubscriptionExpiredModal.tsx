import React, { useState, useEffect } from 'react';
import { AlertOctagon, CreditCard, HelpCircle } from 'lucide-react';
import { apiEvents } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const SubscriptionExpiredModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [errorData, setErrorData] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleSubscriptionExpired = (event: Event) => {
            const customEvent = event as CustomEvent;
            setErrorData(customEvent.detail);
            setIsOpen(true);
        };

        apiEvents.addEventListener('subscription-expired', handleSubscriptionExpired);

        return () => {
            apiEvents.removeEventListener('subscription-expired', handleSubscriptionExpired);
        };
    }, []);

    const handleRenewClick = () => {
        setIsOpen(false);
        navigate('/admin/settings');
    };

    const handleSupportClick = () => {
        window.location.href = 'mailto:support@ems.studio?subject=Subscription%20Expired';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-600">
                <div className="p-6 text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <AlertOctagon className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Subscription Expired
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        {errorData?.message || "Your subscription has expired. Please renew your plan to restore full access to your studio."}
                        {errorData?.details?.gracePeriod && (
                            <span className="block mt-2 text-sm text-orange-600 font-medium">
                                You are currently in a grace period.
                            </span>
                        )}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleRenewClick}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <CreditCard size={20} />
                            Renew Subscription
                        </button>

                        <button
                            onClick={handleSupportClick}
                            className="w-full py-3.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <HelpCircle size={18} />
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpiredModal;
