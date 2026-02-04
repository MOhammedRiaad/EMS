import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle, Users } from 'lucide-react';
import { tenantService } from '../../services/tenant.service';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import PlanUsageOverview from '../../components/admin/PlanUsageOverview';

const AdminSettings: React.FC = () => {
    const { user, isEnabled } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [cancellationWindow, setCancellationWindow] = useState<number>(48);

    // New Settings State
    const [enforce2FA, setEnforce2FA] = useState(false);
    const [language, setLanguage] = useState('en');
    const [timezone, setTimezone] = useState('UTC');
    const [reviewFilter, setReviewFilter] = useState<'all' | 'positive'>('all');
    const [allowCoachAvailabilityEdit, setAllowCoachAvailabilityEdit] = useState(false);

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user?.tenantId) return;
            try {
                const tenant = await tenantService.get(user.tenantId);
                const settings = tenant.settings || {};

                // Load settings with defaults
                setCancellationWindow(settings.cancellationWindowHours ?? 48);
                setEnforce2FA(settings.security?.enforce2FA ?? false);
                setLanguage(settings.localization?.language ?? 'en');
                setTimezone(settings.localization?.timezone ?? 'UTC');
                setReviewFilter(settings.notifications?.reviewFilter ?? 'all');
                setAllowCoachAvailabilityEdit(settings.allowCoachSelfEditAvailability ?? false);

            } catch (err) {
                console.error('Failed to fetch settings', err);
                setError('Failed to load settings. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user?.tenantId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // First fetch current tenant to preserve other settings if any
            const currentTenant = await tenantService.get(user.tenantId);
            const currentSettings = currentTenant.settings || {};

            const updatedSettings = {
                ...currentSettings,
                cancellationWindowHours: Number(cancellationWindow),
                security: {
                    ...currentSettings.security,
                    enforce2FA
                },
                localization: {
                    ...currentSettings.localization,
                    language,
                    timezone
                },
                notifications: {
                    ...currentSettings.notifications,
                    reviewFilter
                },
                allowCoachSelfEditAvailability: allowCoachAvailabilityEdit
            };

            await tenantService.update(user.tenantId, {
                settings: updatedSettings
            });

            setSuccessMessage('Settings updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="pb-20">
            <PageHeader
                title="Studio Settings"
                description="Configure studio-wide policies and preferences"
            />

            <div className="max-w-3xl space-y-8">

                {/* Plan & Usage Overview */}
                <PlanUsageOverview />

                {/* Status Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-2">
                        <Save size={18} />
                        <span>{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-8">

                    {/* Cancellation Policy */}
                    {isEnabled('core.cancellation_policy') && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                                <Settings className="text-gray-500" size={24} />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cancellation Policy</h2>
                                    <p className="text-sm text-gray-500">Manage booking rules</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cancellation Window (Hours)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cancellationWindow}
                                        onChange={(e) => setCancellationWindow(Number(e.target.value))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        Sessions cancelled fewer than this many hours in advance will assume a credit was used.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <div className="text-purple-600">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security & Access</h2>
                                <p className="text-sm text-gray-500">Manage studio security</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Your Two-Factor Authentication</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Secure your own admin account.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIs2FAModalOpen(true)}
                                    className="px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 rounded-lg font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                                >
                                    Manage 2FA
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">Enforce 2FA for Staff</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Require all coaches and admins to enable 2FA.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enforce2FA}
                                            onChange={(e) => setEnforce2FA(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Preferences */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <Settings className="text-blue-500" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Preferences</h2>
                                <p className="text-sm text-gray-500">Localization and region</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Default Language
                                </label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Spanish (Español)</option>
                                    <option value="de">German (Deutsch)</option>
                                    <option value="ar">Arabic (العربية)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Timezone
                                </label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time (US)</option>
                                    <option value="Europe/London">London (GMT)</option>
                                    <option value="Europe/Berlin">Berlin (CET)</option>
                                    <option value="Asia/Dubai">Dubai (GST)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notification Defaults */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <Settings className="text-orange-500" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notification Defaults</h2>
                                <p className="text-sm text-gray-500">Global alert settings</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Public Reviews Filter
                            </label>
                            <select
                                value={reviewFilter}
                                onChange={(e) => setReviewFilter(e.target.value as any)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">Publish All Reviews Automatically</option>
                                <option value="positive">Publish Only Positive (4-5 stars)</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-2">
                                Controls which reviews appear on your public landing page automatically.
                            </p>
                        </div>
                    </div>

                    {/* Coach Permissions */}
                    {isEnabled('coach.portal') && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                                <Users className="text-green-500" size={24} />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Coach Permissions</h2>
                                    <p className="text-sm text-gray-500">Manage what coaches can do</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Allow Availability Editing</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        If enabled, coaches can set their own working hours and time off.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowCoachAvailabilityEdit}
                                        onChange={(e) => setAllowCoachAvailabilityEdit(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={20} />
                            {saving ? 'Saving Changes...' : 'Save All Settings'}
                        </button>
                    </div>
                </form>
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

export default AdminSettings;
