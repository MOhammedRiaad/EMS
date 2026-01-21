import { useNavigate } from 'react-router-dom';
import { User, Settings, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import { useClientProfileState } from './useClientProfileState';
import {
    ProfilePhotoSection,
    ActivePlanSection,
    AccountDetailsSection,
    EditProfileModal
} from './ClientProfileComponents';

const ClientProfile = () => {
    const navigate = useNavigate();
    const state = useClientProfileState();

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

                {/* Profile Photo Section */}
                <ProfilePhotoSection
                    avatarUrl={avatarUrl}
                    initials={initials}
                    profile={state.profile}
                    uploading={state.uploading}
                    fileInputRef={state.fileInputRef}
                    onImageUpload={state.handleImageUpload}
                />

                {/* Active Plan */}
                <ActivePlanSection activePackage={state.activePackage} />

                {/* Account Info */}
                <AccountDetailsSection profile={state.profile} />

                {/* Quick Actions */}
                <div className="premium-card divide-y divide-gray-100 dark:divide-slate-800 animate-fade-in-up stagger-3">
                    <button
                        onClick={() => navigate('/client/notifications')}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors rounded-t-xl"
                    >
                        <span className="text-gray-700 dark:text-gray-300">Notification Preferences</span>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button
                        onClick={() => navigate('/client/privacy')}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <span className="text-gray-700 dark:text-gray-300">Privacy Settings</span>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button
                        onClick={() => navigate('/client/help')}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors rounded-b-xl"
                    >
                        <span className="text-gray-700 dark:text-gray-300">Help & Support</span>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Sign Out */}
                <button
                    onClick={state.handleSignOut}
                    className="w-full py-3 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors animate-fade-in-up stagger-4"
                >
                    Sign Out
                </button>
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
        </div>
    );
};

export default ClientProfile;
