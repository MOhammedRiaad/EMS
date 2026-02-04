import { useState, useEffect } from 'react';
import {
    Settings,
    RefreshCw,
    Shield,
    Database,
    Server,
    Mail
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';

const OwnerSettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [systemStatus] = useState<'healthy' | 'degraded' | 'maintenance'>('healthy');
    const [settings, setSettings] = useState<any>({
        retention: {},
        security: {},
        maintenance: {}
    });
    // const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await ownerPortalService.getSystemSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const handleSystemCheck = async () => {
        setLoading(true);
        try {
            await ownerPortalService.triggerSystemCheck();
            alert('System check triggered successfully. Check alerts for results.');
        } catch (error) {
            alert('Failed to trigger system check');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = async (category: string, key: string, value: any) => {
        // setSaving(true);
        try {
            await ownerPortalService.updateSystemSetting(key, value, category);

            // Optimistic update
            setSettings({
                ...settings,
                [category]: {
                    ...settings[category],
                    [key]: value
                }
            });
        } catch (error) {
            console.error('Failed to update setting', error);
            alert('Failed to save setting');
        } finally {
            // setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="text-gray-600" /> Platform Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">System configuration and maintenance</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 capitalize
                        ${systemStatus === 'healthy' ? 'bg-green-100 text-green-700' :
                            systemStatus === 'degraded' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                     `}>
                        <div className={`w-2 h-2 rounded-full ${systemStatus === 'healthy' ? 'bg-green-600' : systemStatus === 'degraded' ? 'bg-amber-600' : 'bg-red-600'}`}></div>
                        System {systemStatus}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Server size={20} /> System Operations
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Health Check</h4>
                                <p className="text-sm text-gray-500">Run a comprehensive system diagnostic</p>
                            </div>
                            <button
                                onClick={handleSystemCheck}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                Run Check
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Maintenance Mode</h4>
                                <p className="text-sm text-gray-500">Temporarily disable access for all non-owner users</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('maintenance', 'system.maintenance_mode', !settings.maintenance['system.maintenance_mode'])}
                                className={`px-4 py-2 rounded-lg transition-colors ${settings.maintenance['system.maintenance_mode'] ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                            >
                                {settings.maintenance['system.maintenance_mode'] ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Database size={20} /> Data Retention
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Audit Logs (Days)</label>
                                <input
                                    type="number"
                                    value={settings.retention['retention.audit_logs_days'] || 90}
                                    onChange={(e) => handleSettingChange('retention', 'retention.audit_logs_days', parseInt(e.target.value))}
                                    className="w-full border p-2 rounded bg-gray-50 dark:bg-slate-900 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Activity Feed (Days)</label>
                                <input
                                    type="number"
                                    value={settings.retention['retention.activity_feed_days'] || 30}
                                    onChange={(e) => handleSettingChange('retention', 'retention.activity_feed_days', parseInt(e.target.value))}
                                    className="w-full border p-2 rounded bg-gray-50 dark:bg-slate-900 dark:border-slate-700"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Changes are auto-saved.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Mail size={20} /> Email Configuration
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-600">Provider</span>
                            <span className="font-medium">SendGrid</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-600">Sender Identity</span>
                            <span className="font-medium">verified</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">Daily Quota</span>
                            <span className="font-medium">Unlimited</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Shield size={20} /> Security
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-600">MFA Enforcement</span>
                            <button
                                onClick={() => handleSettingChange('security', 'security.mfa_enforced', !settings.security['security.mfa_enforced'])}
                                className={`text-sm font-medium ${settings.security['security.mfa_enforced'] ? 'text-green-600' : 'text-amber-600'}`}
                            >
                                {settings.security['security.mfa_enforced'] ? 'Enforced' : 'Optional'}
                            </button>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-600">Session Timeout</span>
                            <span className="font-medium">24 hours</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerSettings;
