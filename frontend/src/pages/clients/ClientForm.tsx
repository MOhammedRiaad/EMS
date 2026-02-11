import React from 'react';
import { Upload, User } from 'lucide-react';
import type { ClientFormData } from './useClientsState';
import type { Studio } from '../../services/studios.service';

import { getImageUrl } from '../../utils/imageUtils';

interface ClientFormProps {
    formData: ClientFormData;
    setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
    studios: Studio[];
    uploading: boolean;
    saving: boolean;
    isEdit: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)'
};

export const ClientForm: React.FC<ClientFormProps> = ({
    formData,
    setFormData,
    studios,
    uploading,
    saving,
    isEdit,
    onSubmit,
    onCancel,
    onAvatarUpload
}) => {
    return (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Avatar Upload */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-primary)',
                        border: '1px dashed var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {formData.avatarUrl ? (
                            <img
                                src={getImageUrl(formData.avatarUrl) || ''}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <User size={32} color="var(--color-text-muted)" />
                        )}
                    </div>
                    <label style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'var(--color-primary)',
                        borderRadius: '50%',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Upload size={14} color="white" />
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={onAvatarUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>First Name</label>
                    <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Last Name</label>
                    <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Email */}
            <div>
                <label style={labelStyle}>Email</label>
                <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={inputStyle}
                />
            </div>

            {/* Password - only for create */}
            {!isEdit && (
                <div>
                    <label style={labelStyle}>
                        Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        style={inputStyle}
                    />
                </div>
            )}

            {/* Gender */}
            <div>
                <label style={labelStyle}>
                    Gender <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                    required
                    value={formData.gender}
                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    style={inputStyle}
                >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
            </div>

            {/* Phone */}
            <div>
                <label style={labelStyle}>Phone</label>
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={inputStyle}
                />
            </div>

            {/* Studio */}
            <div>
                <label style={labelStyle}>
                    Studio <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select
                    required
                    value={formData.studioId}
                    onChange={e => setFormData(prev => ({ ...prev, studioId: e.target.value }))}
                    style={inputStyle}
                >
                    <option value="">Select a Studio</option>
                    {studios.filter(s => s.isActive).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        opacity: saving ? 0.6 : 1
                    }}
                >
                    {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
                </button>
            </div>
        </form>
    );
};

export default ClientForm;
