import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { coachesService } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { AlertCircle } from 'lucide-react';

const CreateCoach: React.FC = () => {
    const navigate = useNavigate();
    const [studios, setStudios] = useState<Studio[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: 'male' as 'male' | 'female' | 'other' | 'pnts',
        studioId: '',
        bio: '',
        specializations: '',
        preferredClientGender: 'any' as 'male' | 'female' | 'any',
    });

    useEffect(() => {
        fetchStudios();
    }, []);

    const fetchStudios = async () => {
        try {
            const data = await studiosService.getAll();
            setStudios(data);
        } catch (err) {
            console.error('Failed to fetch studios', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            await coachesService.createWithUser({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                studioId: formData.studioId,
                bio: formData.bio || undefined,
                specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : undefined,
                preferredClientGender: formData.preferredClientGender
            });
            navigate('/coaches');
        } catch (err: any) {
            setError(err.message || 'Failed to create coach');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
    };

    return (
        <div>
            <PageHeader
                title="Create Coach"
                description="Add a new coach to your team"
            />

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: '1.5rem',
                        borderRadius: 'var(--border-radius-lg)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Personal Information</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    First Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Last Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Email <span style={{ color: 'var(--color-danger)' }}>*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="Min 6 characters"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Gender <span style={{ color: 'var(--color-danger)' }}>*</span>
                            </label>
                            <select
                                required
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                                style={inputStyle}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="pnts">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: '1.5rem',
                        borderRadius: 'var(--border-radius-lg)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Coach Details</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Studio <span style={{ color: 'var(--color-danger)' }}>*</span>
                            </label>
                            <select
                                required
                                value={formData.studioId}
                                onChange={e => setFormData({ ...formData, studioId: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="">Choose a studio...</option>
                                {studios.filter(s => s.isActive).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Bio (optional)
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                                placeholder="Tell us about this coach..."
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Specializations (optional)
                            </label>
                            <input
                                type="text"
                                value={formData.specializations}
                                onChange={e => setFormData({ ...formData, specializations: e.target.value })}
                                style={inputStyle}
                                placeholder="e.g. EMS Training, Weight Loss, Fitness"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                Separate multiple specializations with commas
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Preferred Client Gender
                            </label>
                            <select
                                value={formData.preferredClientGender}
                                onChange={e => setFormData({ ...formData, preferredClientGender: e.target.value as any })}
                                style={inputStyle}
                            >
                                <option value="any">Any</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/coaches')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                fontSize: '0.875rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--border-radius-md)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: '0.75rem 1.5rem',
                                fontSize: '0.875rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--border-radius-md)',
                                opacity: saving ? 0.6 : 1,
                                cursor: saving ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {saving ? 'Creating Coach...' : 'Create Coach'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCoach;
