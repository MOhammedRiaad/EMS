import React, { useState, useEffect } from 'react';
import { UserPlus, Users, AlertCircle, Check, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/users.service';
import '../../styles/variables.css';

interface UserData {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    active?: boolean;
}

const UserManagement: React.FC = () => {
    const { token, user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [createError, setCreateError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Create user form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'coach' | 'client'>('client');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | 'pnts'>('pnts');
    const [creating, setCreating] = useState(false);

    // Check if current user can manage users
    const canManageUsers = user?.role === 'tenant_owner' || user?.role === 'admin';

    useEffect(() => {
        if (canManageUsers) {
            fetchUsers();
        }
    }, [canManageUsers, token]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await usersService.getAllUsers();
            // Filter to show only admins and tenant_owners (hide clients/coaches)
            setUsers(data.filter(u => u.role === 'admin' || u.role === 'tenant_owner'));
            setFetchError(null);
        } catch (err: any) {
            setFetchError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);

        try {
            const newUser = await usersService.createUser({
                firstName,
                lastName,
                email,
                password,
                role,
                gender,
            });

            setUsers([...users, newUser]);

            // Reset form
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setRole('client');
            setGender('pnts');
            setShowCreateForm(false);
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        try {
            await usersService.deleteUser(userId);
            fetchUsers();
        } catch (err) {
            console.error('Failed to delete user', err);
        }
    };

    if (!canManageUsers) {
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
                    onClick={() => setShowCreateForm(!showCreateForm)}
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
            {showCreateForm && (
                <div style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem', fontSize: '1.125rem' }}>Create New User</h3>

                    {createError && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--color-danger)',
                            color: 'var(--color-danger)',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius-md)',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                        }}>
                            <AlertCircle size={16} />
                            <span>{createError}</span>
                        </div>
                    )}

                    <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Min 6 characters"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'admin' | 'coach' | 'client')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="client">Client</option>
                                    <option value="coach">Coach</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | 'pnts')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="pnts">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid var(--border-color)',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    backgroundColor: 'var(--color-accent)',
                                    color: 'white',
                                    borderRadius: 'var(--border-radius-md)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: creating ? 0.7 : 1
                                }}
                            >
                                {creating ? 'Creating...' : (
                                    <>
                                        <Check size={18} />
                                        Create User
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users List */}
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Loading users...
                    </div>
                ) : fetchError ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-danger)' }}>
                        {fetchError}
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <Users size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--color-text-secondary)' }}>No users created yet. Click "Add User" to create your first user.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-primary)' }}>{u.firstName} {u.lastName}</td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--border-radius-sm)',
                                            backgroundColor: u.role === 'tenant_owner' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: u.role === 'tenant_owner' ? 'rgb(139, 92, 246)' : 'rgb(59, 130, 246)',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            textTransform: 'capitalize'
                                        }}>{u.role.replace('_', ' ')}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            backgroundColor: u.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: u.active ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}>
                                            {u.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await usersService.toggleActive(u.id, !u.active);
                                                        fetchUsers();
                                                    } catch (err) {
                                                        console.error('Failed to toggle user status', err);
                                                    }
                                                }}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    fontSize: '0.75rem',
                                                    borderRadius: 'var(--border-radius-sm)',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--color-bg-primary)',
                                                    color: u.active ? 'var(--color-danger)' : 'var(--color-success)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {u.active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            {u.role !== 'tenant_owner' && (
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        color: 'var(--color-danger)',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
