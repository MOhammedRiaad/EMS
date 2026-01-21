import React from 'react';
import { Package, Camera, Mail, Phone, Calendar, Sparkles } from 'lucide-react';

// ============================================================================
// ProfilePhotoSection - Premium Avatar with Gradient Ring
// ============================================================================

export interface ProfilePhotoSectionProps {
    avatarUrl: string | null;
    initials: string;
    profile: any;
    uploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfilePhotoSection: React.FC<ProfilePhotoSectionProps> = ({
    avatarUrl, initials, profile, uploading, fileInputRef, onImageUpload
}) => (
    <section className="premium-card p-6 animate-fade-in-up">
        <div className="flex items-center space-x-5">
            {/* Avatar with gradient ring */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full opacity-75 group-hover:opacity-100 blur transition-opacity animate-glow"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-1">
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={`${profile?.firstName} ${profile?.lastName}`} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                {initials}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-full p-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-90 disabled:opacity-50 shadow-lg"
                    title="Change photo"
                >
                    {uploading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                    ) : (
                        <Camera size={16} className="text-gray-600 dark:text-gray-300" />
                    )}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onImageUpload}
                    className="hidden"
                />
            </div>
            {/* User Info */}
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.firstName} {profile?.lastName}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 mt-1">
                    <Mail size={14} />
                    {profile?.email}
                </p>
                {profile?.phone && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                        <Phone size={14} />
                        {profile.phone}
                    </p>
                )}
                {profile?.memberSince && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1 mt-2">
                        <Calendar size={12} />
                        Member since {new Date(profile.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                )}
            </div>
        </div>
    </section>
);

// ============================================================================
// ActivePlanSection - Premium Package Card
// ============================================================================

export interface ActivePlanSectionProps {
    activePackage: any;
}

export const ActivePlanSection: React.FC<ActivePlanSectionProps> = ({ activePackage }) => (
    <section className="animate-fade-in-up stagger-1">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">Active Plan</h2>
        {activePackage ? (
            <div className="premium-card p-5 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-900/20 rounded-full -mr-16 -mt-16 opacity-60" />

                {/* Active badge */}
                <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold">
                        <Sparkles size={12} />
                        Active
                    </span>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-5">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Package className="text-white" size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{activePackage.package?.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Expires {new Date(activePackage.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Sessions progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Sessions Remaining</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {activePackage.sessionsRemaining}
                                <span className="font-normal text-gray-400"> / {activePackage.sessionsUsed + activePackage.sessionsRemaining}</span>
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${(activePackage.sessionsRemaining / (activePackage.sessionsUsed + activePackage.sessionsRemaining)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="premium-card p-8 text-center border-dashed">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    <Package className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-3">No active plan</p>
                <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                    Contact Studio to Purchase
                </button>
            </div>
        )}
    </section>
);

// ============================================================================
// AccountDetailsSection - Enhanced Version
// ============================================================================

export interface AccountDetailsSectionProps {
    profile: any;
}

export const AccountDetailsSection: React.FC<AccountDetailsSectionProps> = ({ profile }) => (
    <section className="animate-fade-in-up stagger-2">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">Account Details</h2>
        <div className="premium-card divide-y divide-gray-100 dark:divide-slate-800">
            <div className="p-4 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Mail size={16} />
                    Email
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{profile?.email}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Phone size={16} />
                    Phone
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{profile?.phone || '—'}</span>
            </div>
            <div className="p-4 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar size={16} />
                    Member Since
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                    {profile?.memberSince
                        ? new Date(profile.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                        : '—'}
                </span>
            </div>
        </div>
    </section>
);

// ============================================================================
// EditProfileModal - Premium Glass Modal
// ============================================================================

export interface EditProfileModalProps {
    editForm: {
        firstName: string;
        lastName: string;
        phone: string;
        gender: 'male' | 'female' | 'other' | 'pnts';
    };
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ editForm, setEditForm, onSubmit, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="premium-card w-full max-w-md p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Camera size={16} />
                </div>
                Edit Profile
            </h2>
            <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                        <input
                            type="text"
                            value={editForm.firstName}
                            onChange={e => setEditForm((prev: any) => ({ ...prev, firstName: e.target.value }))}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                        <input
                            type="text"
                            value={editForm.lastName}
                            onChange={e => setEditForm((prev: any) => ({ ...prev, lastName: e.target.value }))}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0 transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input
                        type="tel"
                        value={editForm.phone}
                        onChange={e => setEditForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                    <select
                        value={editForm.gender}
                        onChange={e => setEditForm((prev: any) => ({ ...prev, gender: e.target.value }))}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0 transition-colors"
                    >
                        <option value="pnts">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-gradient px-6 py-3 rounded-xl font-semibold"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    </div>
);

