import React, { useState } from 'react';
import { Settings, ShieldCheck } from 'lucide-react';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';

const CoachSettings: React.FC = () => {
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20 p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="text-blue-600" />
                Settings
            </h1>

            {/* Security Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <ShieldCheck className="text-purple-600" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Add an extra layer of security to your account.
                        </p>
                    </div>
                    <button
                        onClick={() => setIs2FAModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                    >
                        Enable 2FA
                    </button>
                </div>
            </div>

            {/* 2FA Setup Modal */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <TwoFactorSetup
                            onComplete={() => setIs2FAModalOpen(false)}
                            onCancel={() => setIs2FAModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoachSettings;
