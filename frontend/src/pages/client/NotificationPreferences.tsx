import React, { useState, useEffect } from 'react';
import { Mail, ChevronLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clientPortalService } from '../../services/client-portal.service';

interface NotificationSetting {
    id: 'marketing' | 'data_processing' | 'booking_updates';
    label: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    isVirtual?: boolean; // If true, not stored in consentFlags
}

const NotificationPreferences: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<NotificationSetting[]>([
        { id: 'booking_updates', label: 'Booking Updates', description: 'Receive booking confirmations and reminders (Required)', icon: <Calendar size={20} />, enabled: true, isVirtual: true },
        { id: 'marketing', label: 'Promotions & Offers', description: 'Special deals and new packages', icon: <Mail size={20} />, enabled: false },
    ]);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const profile = await clientPortalService.getProfile();
            setSettings(prev => prev.map(s => {
                if (s.isVirtual) return s;
                if (s.id === 'marketing') return { ...s, enabled: profile.consentFlags?.marketing ?? false };
                // Map other keys if they existed
                return s;
            }));
        } catch (error) {
            console.error('Failed to load preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSetting = (id: string) => {
        // Prevent disabling virtual required settings
        const setting = settings.find(s => s.id === id);
        if (setting?.isVirtual) return;

        setSettings(prev => prev.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const marketingEnabled = settings.find(s => s.id === 'marketing')?.enabled;

            await clientPortalService.updateProfile({
                consentFlags: {
                    marketing: marketingEnabled,
                    data_processing: true // Always true if they are using the app
                }
            });
            navigate(-1);
        } catch (error) {
            console.error('Failed to save preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

            <div className="relative p-4 pb-24 max-w-lg mx-auto">
                <header className="flex items-center gap-4 mb-6 animate-fade-in-up">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft size={24} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive updates</p>
                    </div>
                </header>

                <div className="premium-card divide-y divide-gray-100 dark:divide-slate-800 animate-fade-in-up">
                    {settings.map((setting, index) => (
                        <div
                            key={setting.id}
                            className={`p-4 flex items-center justify-between ${setting.isVirtual ? 'opacity-70' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    {setting.icon}
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{setting.label}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleSetting(setting.id)}
                                disabled={setting.isVirtual}
                                className={`relative w-12 h-7 rounded-full transition-colors ${setting.enabled
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                    : 'bg-gray-200 dark:bg-slate-700'
                                    } ${setting.isVirtual ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${setting.enabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 animate-fade-in-up stagger-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-gradient w-full py-4 px-6 rounded-xl font-semibold disabled:opacity-70"
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>

                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
                    Booking updates are mandatory for service delivery.
                </p>
            </div>
        </div>
    );
};

export default NotificationPreferences;
