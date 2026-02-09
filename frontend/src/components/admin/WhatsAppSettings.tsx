import React, { useState } from 'react';
import { MessageSquare, Save, AlertCircle, CheckCircle2, Globe, Shield } from 'lucide-react';
import { api } from '../../services/api';

interface WhatsAppConfig {
    provider: 'meta' | 'wrapper';
    enabled: boolean;
    reminderEnabled?: boolean;
    reminderTime?: string;
    config: {
        phoneNumberId?: string;
        businessAccountId?: string;
        accessToken?: string;
        apiUrl?: string;
        token?: string;
    };
}

interface WhatsAppSettingsProps {
    initialConfig?: WhatsAppConfig;
    onSave: (config: WhatsAppConfig) => Promise<void>;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ initialConfig, onSave }) => {
    const [config, setConfig] = useState<WhatsAppConfig>(initialConfig || {
        provider: 'meta',
        enabled: false,
        config: {}
    });
    const [loading, setLoading] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleConfigChange = (field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [field]: value
            }
        }));
    };

    const handleReminderToggle = (enabled: boolean) => {
        setConfig(prev => ({
            ...prev,
            reminderEnabled: enabled,
            reminderTime: enabled && !prev.reminderTime ? '10:00' : prev.reminderTime
        }));
    };

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setError(null);
        try {
            const res = await api.post('/tenants/whatsapp/test-connection', config);
            if (res.data.success) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
                setError('Connection test failed. Please check your credentials.');
            }
        } catch (err: any) {
            setTestStatus('error');
            setError(err.message || 'Failed to test connection');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(config);
        } catch (err: any) {
            setError(err.message || 'Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <MessageSquare className="text-green-500" size={24} />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">WhatsApp Integration</h2>
                        <p className="text-sm text-gray-500">Automate reminders and notifications</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
            </div>

            {config.enabled && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, provider: 'meta' })}
                            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${config.provider === 'meta'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600 dark:text-green-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Globe size={16} />
                            Meta Cloud API (Official)
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, provider: 'wrapper' })}
                            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${config.provider === 'wrapper'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600 dark:text-green-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Shield size={16} />
                            Wrapper API (Unofficial)
                        </button>
                    </div>

                    {config.provider === 'meta' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number ID</label>
                                <input
                                    type="text"
                                    value={config.config.phoneNumberId || ''}
                                    onChange={(e) => handleConfigChange('phoneNumberId', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20"
                                    placeholder="e.g. 104523..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Account ID</label>
                                <input
                                    type="text"
                                    value={config.config.businessAccountId || ''}
                                    onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20"
                                    placeholder="e.g. 509238..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permanent Access Token</label>
                                <input
                                    type="password"
                                    value={config.config.accessToken || ''}
                                    onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20"
                                    placeholder="EAAB..."
                                />
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl space-y-3">
                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                    <Globe size={16} />
                                    How to get Meta Credentials?
                                </h4>
                                <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-2 list-decimal ml-4">
                                    <li>Go to <a href="https://developers.facebook.com" target="_blank" className="underline font-bold">Meta Developers Portal</a> and create a "Business" app.</li>
                                    <li>Add the "WhatsApp" product to your app.</li>
                                    <li>In <strong>WhatsApp &gt; Getting Started</strong>, you will find your <strong>Phone Number ID</strong> and <strong>WhatsApp Business Account ID</strong>.</li>
                                    <li>To get a <strong>Permanent Token</strong>, go to <strong>Business Settings &gt; Users &gt; System Users</strong>, create a system user, and generate a token with <code>whatsapp_business_messaging</code> permissions.</li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Base URL</label>
                                <input
                                    type="text"
                                    value={config.config.apiUrl || ''}
                                    onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20"
                                    placeholder="https://apiUrl.cloud/api"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Token</label>
                                <input
                                    type="password"
                                    value={config.config.token || ''}
                                    onChange={(e) => handleConfigChange('token', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20"
                                    placeholder="your-secret-token"
                                />
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    Wrapper APIs allow sending "just text" without pre-approving templates. However, ensure you comply with WhatsApp terms to avoid account restriction.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Daily Session Reminders</h3>
                                <p className="text-xs text-gray-500">Automatically send reminders for sessions occurring the next day</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.reminderEnabled}
                                    onChange={(e) => handleReminderToggle(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        {config.reminderEnabled && (
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Send everyday at</label>
                                    <input
                                        type="time"
                                        value={config.reminderTime || '10:00'}
                                        onChange={(e) => setConfig(prev => ({ ...prev, reminderTime: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                                <div className="flex-1 pt-5">
                                    <p className="text-[10px] text-gray-500 italic">
                                        Reminders will be sent for all scheduled sessions starting tomorrow.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing'}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                            {testStatus === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                            {testStatus === 'error' && <AlertCircle size={16} className="text-red-500" />}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppSettings;
