import React, { useState } from 'react';
import { Shield, Eye, Camera, Activity, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrivacySetting {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
}

const PrivacySettings: React.FC = () => {
    const navigate = useNavigate();

    const [settings, setSettings] = useState<PrivacySetting[]>([
        { id: 'profile_visible', label: 'Profile Visibility', description: 'Allow coaches to see your profile details', icon: <Eye size={20} />, enabled: true },
        { id: 'show_progress', label: 'Share Progress', description: 'Let coaches view your InBody progress', icon: <Activity size={20} />, enabled: true },
        { id: 'photo_consent', label: 'Photo Consent', description: 'Allow coaches to take progress photos', icon: <Camera size={20} />, enabled: false },
        { id: 'leaderboard_visible', label: 'Leaderboard Visibility', description: 'Show my name and stats on the leaderboard', icon: <Activity size={20} />, enabled: true },
        { id: 'activity_feed_visible', label: 'Activity Feed', description: 'Display my achievements in the activity feed', icon: <Activity size={20} />, enabled: true },
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Control your data sharing preferences</p>
                    </div>
                </header>

                {/* Privacy Badge */}
                <div className="premium-card p-4 mb-6 flex items-center gap-4 animate-fade-in-up">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Your Data is Protected</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">We never share your data with third parties</p>
                    </div>
                </div>

                {/* Settings List */}
                <div className="premium-card divide-y divide-gray-100 dark:divide-slate-800 animate-fade-in-up stagger-1">
                    {settings.map((setting) => (
                        <div
                            key={setting.id}
                            className="p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
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
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
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

                {/* Data Deletion Section */}
                <div className="mt-6 premium-card p-5 animate-fade-in-up stagger-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data Management</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Request a copy of your data or delete your account
                    </p>
                    <div className="flex gap-3">
                        <button className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
                            Download Data
                        </button>
                        <button className="flex-1 py-3 px-4 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm">
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 animate-fade-in-up stagger-3">
                    <button className="btn-gradient w-full py-4 px-6 rounded-xl font-semibold">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettings;
