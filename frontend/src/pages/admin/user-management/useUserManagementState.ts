import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usersService } from '../../../services/users.service';

export interface UserData {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    active?: boolean;
}

export interface CreateUserFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'admin' | 'coach' | 'client';
    gender: 'male' | 'female' | 'other' | 'pnts';
}

const initialFormData: CreateUserFormData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'client',
    gender: 'pnts'
};

export function useUserManagementState() {
    const { user } = useAuth();

    // Data state
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [createError, setCreateError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState<CreateUserFormData>(initialFormData);
    const [creating, setCreating] = useState(false);

    const canManageUsers = user?.role === 'tenant_owner' || user?.role === 'admin';

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await usersService.getAllUsers();
            // Filter to show only admins and tenant_owners
            setUsers(data.filter(u => u.role === 'admin' || u.role === 'tenant_owner'));
            setFetchError(null);
        } catch (err: any) {
            setFetchError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (canManageUsers) {
            fetchUsers();
        }
    }, [canManageUsers, fetchUsers]);

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setCreateError(null);
    }, []);

    const handleCreateUser = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);

        try {
            const newUser = await usersService.createUser({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                gender: formData.gender,
            });

            setUsers(prev => [...prev, newUser]);
            resetForm();
            setShowCreateForm(false);
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setCreating(false);
        }
    }, [formData, resetForm]);

    const handleDelete = useCallback(async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        try {
            await usersService.deleteUser(userId);
            fetchUsers();
        } catch (err) {
            console.error('Failed to delete user', err);
        }
    }, [fetchUsers]);

    const handleToggleActive = useCallback(async (userId: string, newActive: boolean) => {
        try {
            await usersService.toggleActive(userId, newActive);
            fetchUsers();
        } catch (err) {
            console.error('Failed to toggle user status', err);
        }
    }, [fetchUsers]);

    return {
        // Data
        users,

        // UI state
        loading,
        createError,
        fetchError,
        canManageUsers,

        // Form
        showCreateForm,
        setShowCreateForm,
        formData,
        setFormData,
        creating,
        resetForm,

        // Handlers
        handleCreateUser,
        handleDelete,
        handleToggleActive
    };
}
