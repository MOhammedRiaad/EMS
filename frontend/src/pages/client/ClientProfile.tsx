import { getImageUrl } from '../../utils/imageUtils';
import { useClientProfileState } from './useClientProfileState';
import {
    ProfilePhotoSection,
    ActivePlanSection,
    AccountDetailsSection,
    EditProfileModal
} from './ClientProfileComponents';

const ClientProfile = () => {
    const state = useClientProfileState();

    if (state.loading) {
        return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
    }

    const avatarUrl = getImageUrl(state.profile?.avatarUrl);
    const initials = `${state.profile?.firstName?.[0] || ''}${state.profile?.lastName?.[0] || ''}`;

    return (
        <div className="p-4 space-y-6 pb-20 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h1>
                <button
                    onClick={state.handleEditClick}
                    className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                >
                    Edit Details
                </button>
            </div>

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

            {/* Sign Out */}
            <div className="pt-4">
                <button
                    onClick={state.handleSignOut}
                    className="w-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
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
