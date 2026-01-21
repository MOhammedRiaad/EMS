import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Calendar, MessageSquare, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationSetting {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
}

const NotificationPreferences: React.FC = () => {
    const navigate = useNavigate();

    const [settings, setSettings] = useState<NotificationSetting[]>([
        { id: 'booking_confirm', label: 'Booking Confirmations', description: 'Get notified when your session is confirmed', icon: <Calendar size={20} />, enabled: true },
        { id: 'booking_reminder', label: 'Session Reminders', description: 'Reminder 24 hours before your session', icon: <Bell size={20} />, enabled: true },
        { id: 'coach_messages', label: 'Coach Messages', description: 'When your coach sends you a message', icon: <MessageSquare size={20} />, enabled: true },
        { id: 'promotions', label: 'Promotions & Offers', description: 'Special deals and new packages', icon: <Mail size={20} />, enabled: false },
        { id: 'push_notifications', label: 'Push Notifications', description: 'Receive notifications on your device', icon: <Smartphone size={20} />, enabled: true },
    ]);

    const toggleSetting = (id: string) => {
        setSettings(prev => prev.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ));
    };

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

            <div className="relative p-4 pb-24 max-w-lg mx-auto">
                {/* Header */}
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

                {/* Settings List */}
                <div className="premium-card divide-y divide-gray-100 dark:divide-slate-800 animate-fade-in-up">
                    {settings.map((setting, index) => (
                        <div
                            key={setting.id}
                            className="p-4 flex items-center justify-between"
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
                                className={`relative w-12 h-7 rounded-full transition-colors ${setting.enabled
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                        : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${setting.enabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <div className="mt-6 animate-fade-in-up stagger-3">
                    <button className="btn-gradient w-full py-4 px-6 rounded-xl font-semibold">
                        Save Preferences
                    </button>
                </div>

                {/* Info Note */}
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
                    You can change these settings anytime
                </p>
            </div>
        </div>
    );
};

export default NotificationPreferences;
