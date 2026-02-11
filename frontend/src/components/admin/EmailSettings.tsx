import React, { useState } from 'react';
import { Mail, Save, AlertCircle, CheckCircle2, Server, Shield, User, Lock } from 'lucide-react';
import { api } from '../../services/api';

interface EmailConfig {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    secure?: boolean;
    fromEmail?: string;
    fromName?: string;
}

interface EmailSettingsProps {
    initialConfig?: EmailConfig;
    onSave: (config: EmailConfig) => Promise<void>;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ initialConfig, onSave }) => {
    const [config, setConfig] = useState<EmailConfig>(initialConfig || {
        host: '',
        port: 587,
        user: '',
        password: '',
        secure: false,
        fromEmail: '',
        fromName: ''
    });
    const [loading, setLoading] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [testEmail, setTestEmail] = useState('');

    const handleChange = (field: keyof EmailConfig, value: any) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTestConnection = async () => {
        if (!testEmail) {
            setError('Please enter an email address to send a test message to.');
            return;
        }

        setTestStatus('testing');
        setError(null);
        try {
            // We need an endpoint for this. For now, we'll assume a generic test endpoint exists or we'll add it later.
            // If the backend doesn't support it yet, this will fail 404.
            // Let's assume we post to /tenants/email/test with the config and target email
            const res = await api.post('/tenants/email/test-connection', { config, to: testEmail });
            if (res.data.success) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
                setError('Connection test failed. Please check your credentials.');
            }
        } catch (err: any) {
            setTestStatus('error');
            setError(err.response?.data?.message || err.message || 'Failed to test connection');
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
                    <Mail className="text-blue-500" size={24} />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Email Configuration</h2>
                        <p className="text-sm text-gray-500">Configure your custom SMTP provider</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">

                {/* SMTP Connection Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <div className="flex items-center gap-2">
                                <Server size={14} />
                                SMTP Host
                            </div>
                        </label>
                        <input
                            type="text"
                            value={config.host}
                            onChange={(e) => handleChange('host', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="smtp.sendgrid.net"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                        <input
                            type="number"
                            value={config.port}
                            onChange={(e) => handleChange('port', Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="587"
                        />
                    </div>

                    <div className="flex items-center pt-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.secure}
                                onChange={(e) => handleChange('secure', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Shield size={14} />
                                Secure (SSL/TLS)
                            </span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <div className="flex items-center gap-2">
                                <User size={14} />
                                Username
                            </div>
                        </label>
                        <input
                            type="text"
                            value={config.user}
                            onChange={(e) => handleChange('user', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="apikey"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <div className="flex items-center gap-2">
                                <Lock size={14} />
                                Password
                            </div>
                        </label>
                        <input
                            type="password"
                            value={config.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Your SMTP password"
                        />
                    </div>
                </div>

                {/* Sender Details */}
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Sender Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Email</label>
                            <input
                                type="email"
                                value={config.fromEmail}
                                onChange={(e) => handleChange('fromEmail', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="notifications@yourdomain.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name</label>
                            <input
                                type="text"
                                value={config.fromName}
                                onChange={(e) => handleChange('fromName', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="My Studio Name"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Configuration</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Enter email to receive test message"
                        />
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing' || !testEmail}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            {testStatus === 'testing' ? 'Sending...' : 'Send Test Email'}
                            {testStatus === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                            {testStatus === 'error' && <AlertCircle size={16} className="text-red-500" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailSettings;
