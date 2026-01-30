import { useState, useEffect, useRef, useCallback } from 'react';
import { clientPortalService, type ClientProfile } from '../../services/client-portal.service';
import { storageService } from '../../services/storage.service';

export interface ProfileEditForm {
    firstName: string;
    lastName: string;
    phone: string;
    gender: 'male' | 'female' | 'other' | 'pnts';
}

export function useClientProfileState() {
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<ProfileEditForm>({
        firstName: '',
        lastName: '',
        phone: '',
        gender: 'pnts'
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = useCallback(async () => {
        try {
            const [dashboard, profileData] = await Promise.all([
                clientPortalService.getDashboard(),
                clientPortalService.getProfile()
            ]);
            setDashboardData(dashboard);
            setProfile(profileData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const avatarUrl = await storageService.upload(file);
            await clientPortalService.updateProfile({ avatarUrl });
            await loadData();
            alert('Profile photo updated successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    }, [loadData]);

    const handleEditClick = useCallback(() => {
        if (profile) {
            setEditForm({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
                gender: profile.gender || 'pnts'
            });
            setIsEditModalOpen(true);
        }
    }, [profile]);

    const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await clientPortalService.updateProfile(editForm);
            setIsEditModalOpen(false);
            loadData();
            alert('Profile updated successfully');
        } catch (err: any) {
            alert(err.message || 'Failed to update profile');
        }
    }, [editForm, loadData]);

    const handleSignOut = useCallback(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }, []);

    return {
        // Data
        profile,
        dashboardData,
        activePackage: dashboardData?.activePackage,

        // State
        loading,
        uploading,
        isEditModalOpen,
        setIsEditModalOpen,
        editForm,
        setEditForm,
        fileInputRef,

        // Handlers
        handleImageUpload,
        handleEditClick,
        handleUpdateProfile,
        handleSignOut,
        refreshProfile: loadData
    };
}
