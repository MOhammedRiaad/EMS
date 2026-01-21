import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { tenantService } from '../../services/tenant.service';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/common/PageHeader';

const AdminSettings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [cancellationWindow, setCancellationWindow] = useState<number>(48);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user?.tenantId) return;
            try {
                const tenant = await tenantService.get(user.tenantId);
                const settings = tenant.settings || {};
                // Default to 48 hours if not set
                setCancellationWindow(settings.cancellationWindowHours ?? 48);
            } catch (err) {
                console.error('Failed to fetch settings', err);
                setError('Failed to load settings. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user?.tenantId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // First fetch current tenant to preserve other settings if any
            const currentTenant = await tenantService.get(user.tenantId);
            const currentSettings = currentTenant.settings || {};

            const updatedSettings = {
                ...currentSettings,
                cancellationWindowHours: Number(cancellationWindow)
            };

            await tenantService.update(user.tenantId, {
                settings: updatedSettings
            });

            setSuccessMessage('Settings updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div>
            <PageHeader
                title="Studio Settings"
                description="Configure studio-wide policies and settings"
            />

            <div style={{ maxWidth: '600px' }}>
                <div style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <Settings className="text-primary" size={24} />
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Cancellation Policy</h2>
                    </div>

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

                    {successMessage && (
                        <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid var(--color-success)',
                            color: 'var(--color-success)',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius-md)',
                            marginBottom: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSave}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                Cancellation Window (Hours)
                            </label>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    value={cancellationWindow}
                                    onChange={(e) => setCancellationWindow(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Sessions cancelled fewer than this many hours in advance will automatically use a session credit (unless manually overridden by admin).
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    borderRadius: 'var(--border-radius-md)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    border: 'none',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
