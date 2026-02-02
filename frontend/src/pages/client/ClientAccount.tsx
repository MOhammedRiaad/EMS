import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Bell, Save, Loader2, Camera, Check } from 'lucide-react';
import { authenticatedFetch } from '../../services/api';

interface AccountData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        sessionReminders: boolean;
        promotions: boolean;
    };
}

const ClientAccount: React.FC = () => {
    const [account, setAccount] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'notifications'>('profile');
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        loadAccount();
    }, []);

    const loadAccount = async () => {
        try {
            setLoading(true);
            const data = await authenticatedFetch('/client-portal/account');
            setAccount(data);
        } catch (err) {
            console.error('Failed to load account:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!account) return;
        try {
            setSaving(true);
            await authenticatedFetch('/client-portal/account', {
                method: 'PATCH',
                body: JSON.stringify({
                    firstName: account.firstName,
                    lastName: account.lastName,
                    phone: account.phone,
                    notificationPreferences: account.notificationPreferences,
                })
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save account:', err);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordError('Passwords do not match');
            return;
        }
        if (passwordForm.new.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        try {
            setSaving(true);
            await authenticatedFetch('/client-portal/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.new,
                })
            });
            setPasswordForm({ current: '', new: '', confirm: '' });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto pb-20 space-y-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Account</h1>

            {/* Section Tabs */}
            <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'password', label: 'Password', icon: Lock },
                    { id: 'notifications', label: 'Alerts', icon: Bell },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeSection === tab.id
                                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Section */}
            {activeSection === 'profile' && account && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 space-y-4">
                    {/* Avatar */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center overflow-hidden">
                                {account.avatarUrl ? (
                                    <img src={account.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-blue-600" />
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700">
                                <Camera size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                            <input
                                type="text"
                                value={account.firstName}
                                onChange={(e) => setAccount({ ...account, firstName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                            <input
                                type="text"
                                value={account.lastName}
                                onChange={(e) => setAccount({ ...account, lastName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Mail size={14} className="inline mr-1" />
                            Email (read-only)
                        </label>
                        <input
                            type="email"
                            value={account.email}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800/50 text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Phone size={14} className="inline mr-1" />
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={account.phone || ''}
                            onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
                        {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            )}

            {/* Password Section */}
            {activeSection === 'password' && (
                <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <input
                            type="password"
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Lock size={18} />}
                        {saved ? 'Password Changed!' : 'Change Password'}
                    </button>
                </form>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && account && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 space-y-4">
                    {[
                        { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                        { key: 'sms', label: 'SMS Notifications', desc: 'Receive text messages' },
                        { key: 'sessionReminders', label: 'Session Reminders', desc: 'Get reminded before sessions' },
                        { key: 'promotions', label: 'Promotions & Offers', desc: 'Special deals and updates' },
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                            <button
                                onClick={() => setAccount({
                                    ...account,
                                    notificationPreferences: {
                                        ...account.notificationPreferences,
                                        [item.key]: !account.notificationPreferences[item.key as keyof typeof account.notificationPreferences]
                                    }
                                })}
                                className={`w-12 h-7 rounded-full transition-colors ${account.notificationPreferences[item.key as keyof typeof account.notificationPreferences]
                                        ? 'bg-blue-600'
                                        : 'bg-gray-300 dark:bg-slate-700'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${account.notificationPreferences[item.key as keyof typeof account.notificationPreferences]
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
                        {saved ? 'Saved!' : 'Save Preferences'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClientAccount;
