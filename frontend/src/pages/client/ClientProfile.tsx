import { useState, useEffect, useRef } from 'react';
import { clientPortalService, type ClientProfile as ClientProfileType } from '../../services/client-portal.service';
import { storageService } from '../../services/storage.service';
import { getImageUrl } from '../../utils/imageUtils';
import { Package, Camera } from 'lucide-react';

const ClientProfile = () => {
    const [profile, setProfile] = useState<ClientProfileType | null>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: 'pnts' as 'male' | 'female' | 'other' | 'pnts'
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        try {
            const [dashboardData, profileData] = await Promise.all([
                clientPortalService.getDashboard(),
                clientPortalService.getProfile()
            ]);
            setData(dashboardData);
            setProfile(profileData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const avatarUrl = await storageService.upload(file);
            await clientPortalService.updateProfile({ avatarUrl });
            await loadData(); // Reload profile
            alert('Profile photo updated successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleEditClick = () => {
        if (profile) {
            setEditForm({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
                gender: profile.gender || 'pnts'
            });
            setIsEditModalOpen(true);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await clientPortalService.updateProfile(editForm);
            setIsEditModalOpen(false);
            loadData();
            alert('Profile updated successfully');
        } catch (err: any) {
            alert(err.message || 'Failed to update profile');
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading profile...</div>;

    const { activePackage } = data || {};
    const avatarUrl = getImageUrl(profile?.avatarUrl);
    const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`;

    return (
        <div className="p-4 space-y-6 pb-20 max-w-2xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Profile</h1>
                <button
                    onClick={handleEditClick}
                    className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                >
                    Edit Details
                </button>
            </div>

            {/* Profile Photo Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={`${profile?.firstName} ${profile?.lastName}`} className="w-full h-full object-cover" />
                            ) : initials}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-full p-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            title="Change photo"
                        >
                            {uploading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            ) : (
                                <Camera size={16} className="text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{profile?.firstName} {profile?.lastName}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
                        {profile?.phone && <p className="text-gray-500 dark:text-gray-400 text-sm">{profile.phone}</p>}
                        {profile?.gender && profile.gender !== 'pnts' && (
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 capitalize">{profile.gender}</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Active Plan */}
            <section>
                <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Active Plan</h2>
                {activePackage ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-bl-xl font-medium text-xs">
                            Active
                        </div>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">{activePackage.package?.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Expires {new Date(activePackage.expiryDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Sessions Remaining</span>
                                <span className="font-medium text-gray-900 dark:text-white">{activePackage.sessionsRemaining} / {activePackage.sessionsUsed + activePackage.sessionsRemaining}</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(activePackage.sessionsRemaining / (activePackage.sessionsUsed + activePackage.sessionsRemaining)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 text-center border border-dashed border-gray-200 dark:border-slate-800">
                        <Package className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                        <p className="text-gray-500 dark:text-gray-400 mb-2">No active plan</p>
                        <button className="text-blue-600 dark:text-blue-400 font-medium text-sm">Purchase a Plan (Contact Studio)</button>
                    </div>
                )}
            </section>

            {/* Account Info */}
            <section>
                <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Account Details</h2>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 divide-y divide-gray-50 dark:divide-slate-800">
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Email</span>
                        <span className="font-medium text-gray-900 dark:text-white">{profile?.email}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Phone</span>
                        <span className="font-medium text-gray-900 dark:text-white">{profile?.phone || '-'}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                        <span className="font-medium text-gray-900 dark:text-white">{profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            </section>

            <div className="pt-4">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="w-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Sign Out
                </button>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={editForm.firstName}
                                        onChange={e => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={editForm.lastName}
                                        onChange={e => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                                <select
                                    value={editForm.gender}
                                    onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value as any }))}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                    <option value="pnts">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientProfile;
