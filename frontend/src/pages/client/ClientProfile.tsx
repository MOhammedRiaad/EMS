import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, ChevronRight, Mail, Phone, Bell, Lock, Shield, Edit2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import { useClientProfileState } from './useClientProfileState';
import {
    ProfilePhotoSection,
    ActivePlanSection,
    AccountDetailsSection,
    EditProfileModal
} from './ClientProfileComponents';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import ClientHealthGoals from '../../components/client/ClientHealthGoals';
import ClientMedicalHistory from '../../components/client/ClientMedicalHistory';
import ClientProgressGallery from '../../components/client/ClientProgressGallery';

const ClientProfile = () => {
    const navigate = useNavigate();
    const state = useClientProfileState();

    // Local state for UI
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'progress'>('overview');

    if (state.loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-200 dark:border-slate-700"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    const avatarUrl = getImageUrl(state.profile?.avatarUrl);
    const initials = `${state.profile?.firstName?.[0] || ''}${state.profile?.lastName?.[0] || ''}`;

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

            <div className="relative p-4 space-y-6 pb-28 max-w-2xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
                            <User size={20} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    </div>
                    <button
                        onClick={state.handleEditClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Settings size={16} />
                        <span className="text-sm font-medium">Edit</span>
                    </button>
                </header>

                {/* Profile Photo Section (Always visible) */}
                <ProfilePhotoSection
                    avatarUrl={avatarUrl}
                    initials={initials}
                    profile={state.profile}
                    uploading={state.uploading}
                    fileInputRef={state.fileInputRef}
                    onImageUpload={state.handleImageUpload}
                />

                {/* Tabs */}
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'overview'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('health')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'health'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Health & Goals
                    </button>
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'progress'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Progress
                    </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-6 animate-fade-in">
                    {activeTab === 'overview' && (
                        <>
                            {/* Active Plan */}
                            <ActivePlanSection activePackage={state.activePackage} />

                            {/* Account Info */}
                            <AccountDetailsSection profile={state.profile} />

                            {/* Quick Actions */}
                            <div className="premium-card divide-y divide-gray-100 dark:divide-slate-800">
                                <button
                                    onClick={() => navigate('/client/notifications')}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors rounded-t-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <Bell size={18} className="text-orange-500" />
                                        <span className="text-gray-700 dark:text-gray-300">Notification Preferences</span>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400" />
                                </button>
                                <button
                                    onClick={() => navigate('/client/privacy')}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Lock size={18} className="text-blue-500" />
                                        <span className="text-gray-700 dark:text-gray-300">Privacy Settings</span>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setIs2FAModalOpen(true)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield size={18} className="text-purple-500" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-700 dark:text-gray-300">Two-Factor Authentication</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">NEW</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Sign Out */}
                            <button
                                onClick={state.handleSignOut}
                                className="w-full py-3 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                                Sign Out
                            </button>
                        </>
                    )}

                    {activeTab === 'health' && (
                        <>
                            <ClientHealthGoals
                                goals={state.profile?.healthGoals}
                                onUpdate={state.refreshProfile}
                            />
                            <ClientMedicalHistory
                                history={state.profile?.medicalHistory}
                                notes={state.profile?.healthNotes}
                            />
                        </>
                    )}

                    {activeTab === 'progress' && (
                        <ClientProgressGallery />
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {state.isEditModalOpen && (
                <EditProfileModal
                    editForm={state.editForm}
                    setEditForm={state.setEditForm}
                    onSubmit={state.handleUpdateProfile}
                    onClose={() => state.setIsEditModalOpen(false)}
                />
            )}

            {/* 2FA Setup Modal */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <TwoFactorSetup
                            onComplete={() => {
                                setIs2FAModalOpen(false);
                                state.refreshProfile(); // Refresh to update badge/status
                            }}
                            onCancel={() => setIs2FAModalOpen(false)}
                            isEnabled={state.profile?.isTwoFactorEnabled}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientProfile;
