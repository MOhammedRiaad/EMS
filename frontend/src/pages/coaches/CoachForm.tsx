import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Studio } from '../../services/studios.service';
import type { CoachFormData, AvailabilityRule } from './useCoachesState';

interface CoachFormProps {
    formData: CoachFormData;
    setFormData: React.Dispatch<React.SetStateAction<CoachFormData>>;
    studios: Studio[];
    error: string | null;
    saving: boolean;
    isEdit: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
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

export const CoachForm: React.FC<CoachFormProps> = ({
    formData,
    setFormData,
    studios,
    error,
    saving,
    isEdit,
    onSubmit,
    onCancel
}) => {
    const updateAvailabilityRule = (index: number, updates: Partial<AvailabilityRule>) => {
        const newRules = [...formData.availabilityRules];
        newRules[index] = { ...newRules[index], ...updates };
        setFormData(prev => ({ ...prev, availabilityRules: newRules }));
    };

    if (isEdit) {
        return (
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Bio</label>
                    <textarea
                        value={formData.bio}
                        onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                        placeholder="Coach bio..."
                    />
                </div>

                <div>
                    <label style={labelStyle}>Specializations (comma-separated)</label>
                    <input
                        type="text"
                        value={formData.specializations}
                        onChange={e => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
                        style={inputStyle}
                        placeholder="e.g. EMS Training, Weight Loss"
                    />
                </div>

                <div>
                    <label style={labelStyle}>Preferred Client Gender</label>
                    <select
                        value={formData.preferredClientGender}
                        onChange={e => setFormData(prev => ({ ...prev, preferredClientGender: e.target.value as any }))}
                        style={inputStyle}
                    >
                        <option value="any">Any</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>

                {/* Availability Rules */}
                <AvailabilitySection
                    rules={formData.availabilityRules}
                    onUpdate={updateAvailabilityRule}
                />

                <FormButtons saving={saving} onCancel={onCancel} submitLabel={saving ? 'Saving...' : 'Update Coach'} />
            </form>
        );
    }

    // Create form
    return (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-danger)',
                    color: 'var(--color-danger)',
                    padding: '0.75rem',
                    borderRadius: 'var(--border-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>First Name <RequiredMark /></label>
                    <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Last Name <RequiredMark /></label>
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
                <label style={labelStyle}>Email <RequiredMark /></label>
                <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={inputStyle}
                />
            </div>

            {/* Password */}
            <div>
                <label style={labelStyle}>Password <RequiredMark /></label>
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

            {/* Gender */}
            <div>
                <label style={labelStyle}>Gender <RequiredMark /></label>
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

            {/* Studio */}
            <div>
                <label style={labelStyle}>Select Studio <RequiredMark /></label>
                <select
                    required
                    value={formData.studioId}
                    onChange={e => setFormData(prev => ({ ...prev, studioId: e.target.value }))}
                    style={inputStyle}
                >
                    <option value="">Choose a studio...</option>
                    {studios.filter(s => s.isActive).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Bio */}
            <div>
                <label style={labelStyle}>Bio (optional)</label>
                <textarea
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                    placeholder="Coach bio..."
                />
            </div>

            {/* Specializations */}
            <div>
                <label style={labelStyle}>Specializations (comma-separated)</label>
                <input
                    type="text"
                    value={formData.specializations}
                    onChange={e => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g. EMS Training, Weight Loss"
                />
            </div>

            {/* Preferred Gender */}
            <div>
                <label style={labelStyle}>Preferred Client Gender</label>
                <select
                    value={formData.preferredClientGender}
                    onChange={e => setFormData(prev => ({ ...prev, preferredClientGender: e.target.value as any }))}
                    style={inputStyle}
                >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            <FormButtons saving={saving} onCancel={onCancel} submitLabel={saving ? 'Creating...' : 'Create Coach'} />
        </form>
    );
};

// Sub-components
const RequiredMark: React.FC = () => (
    <span style={{ color: 'var(--color-danger)' }}>*</span>
);

const FormButtons: React.FC<{ saving: boolean; onCancel: () => void; submitLabel: string }> = ({
    saving,
    onCancel,
    submitLabel
}) => (
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
            {submitLabel}
        </button>
    </div>
);

const AvailabilitySection: React.FC<{
    rules: AvailabilityRule[];
    onUpdate: (index: number, updates: Partial<AvailabilityRule>) => void;
}> = ({ rules, onUpdate }) => (
    <div>
        <label style={{ ...labelStyle, fontWeight: 600 }}>Weekly Availability</label>
        {rules.map((rule, index) => (
            <div
                key={rule.dayOfWeek}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    alignItems: 'center'
                }}
            >
                <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{rule.dayOfWeek}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <input
                            type="checkbox"
                            checked={rule.available}
                            onChange={e => onUpdate(index, { available: e.target.checked })}
                        />
                        Available
                    </label>
                    {rule.available && (
                        <>
                            <input
                                type="time"
                                value={rule.startTime}
                                onChange={e => onUpdate(index, { startTime: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                            <span>to</span>
                            <input
                                type="time"
                                value={rule.endTime}
                                onChange={e => onUpdate(index, { endTime: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                        </>
                    )}
                </div>
            </div>
        ))}
    </div>
);

export default CoachForm;
