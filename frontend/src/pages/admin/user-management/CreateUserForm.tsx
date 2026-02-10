import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import type { CreateUserFormData } from './useUserManagementState';

interface CreateUserFormProps {
    formData: CreateUserFormData;
    setFormData: React.Dispatch<React.SetStateAction<CreateUserFormData>>;
    error: string | null;
    creating: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    fontSize: '1rem'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--color-text-secondary)'
};

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
    formData,
    setFormData,
    error,
    creating,
    onSubmit,
    onCancel
}) => {
    return (
        <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)'
        }}>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem', fontSize: '1.125rem' }}>
                Create New User
            </h3>

            {error && (
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
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>First Name</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            style={inputStyle}
                            placeholder="John"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Last Name</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            style={inputStyle}
                            placeholder="Doe"
                        />
                    </div>
                </div>

                {/* Email & Password */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            style={inputStyle}
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            minLength={6}
                            style={inputStyle}
                            placeholder="Min 6 characters"
                        />
                    </div>
                </div>

                {/* Role & Gender */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Role</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                            style={inputStyle}
                        >
                            <option value="client">Client</option>
                            <option value="coach">Coach</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Gender</label>
                        <select
                            value={formData.gender}
                            onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                            style={inputStyle}
                        >
                            <option value="prefer_not_to_say">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={onCancel}
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
    );
};

export default CreateUserForm;
