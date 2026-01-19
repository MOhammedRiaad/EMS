import React from 'react';
import { UserPlus, Users, Shield } from 'lucide-react';
import { useUserManagementState } from './user-management/useUserManagementState';
import { CreateUserForm } from './user-management/CreateUserForm';
import { UsersTable } from './user-management/UsersTable';
import '../../styles/variables.css';

const UserManagement: React.FC = () => {
    const state = useUserManagementState();

    if (!state.canManageUsers) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Shield size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--color-text-primary)' }}>Access Denied</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Only Tenant Owners and Admins can manage users.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                        User Management
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        Create and manage users for your studio
                    </p>
                </div>
                <button
                    onClick={() => state.setShowCreateForm(!state.showCreateForm)}
                    style={{
                        padding: '0.75rem 1.25rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <UserPlus size={18} />
                    Add User
                </button>
            </div>

            {/* Create User Form */}
            {state.showCreateForm && (
                <CreateUserForm
                    formData={state.formData}
                    setFormData={state.setFormData}
                    error={state.createError}
                    creating={state.creating}
                    onSubmit={state.handleCreateUser}
                    onCancel={() => { state.setShowCreateForm(false); state.resetForm(); }}
                />
            )}

            {/* Users List */}
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                {state.loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Loading users...
                    </div>
                ) : state.fetchError ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-danger)' }}>
                        {state.fetchError}
                    </div>
                ) : state.users.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <Users size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            No users created yet. Click "Add User" to create your first user.
                        </p>
                    </div>
                ) : (
                    <UsersTable
                        users={state.users}
                        onToggleActive={state.handleToggleActive}
                        onDelete={state.handleDelete}
                    />
                )}
            </div>
        </div>
    );
};

export default UserManagement;
