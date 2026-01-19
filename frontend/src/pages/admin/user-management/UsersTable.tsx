import React from 'react';
import { Trash2 } from 'lucide-react';
import type { UserData } from './useUserManagementState';

interface UsersTableProps {
    users: UserData[];
    onToggleActive: (userId: string, newActive: boolean) => void;
    onDelete: (userId: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
    users,
    onToggleActive,
    onDelete
}) => {
    return (
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
                {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', color: 'var(--color-text-primary)' }}>
                            {u.firstName} {u.lastName}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                            {u.email}
                        </td>
                        <td style={{ padding: '1rem' }}>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--border-radius-sm)',
                                backgroundColor: u.role === 'tenant_owner' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: u.role === 'tenant_owner' ? 'rgb(139, 92, 246)' : 'rgb(59, 130, 246)',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'capitalize'
                            }}>
                                {u.role.replace('_', ' ')}
                            </span>
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
                                    onClick={() => onToggleActive(u.id, !u.active)}
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
                                        onClick={() => onDelete(u.id)}
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
    );
};

export default UsersTable;
