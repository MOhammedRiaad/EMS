import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { inbodyService, type CreateInBodyScanInput } from '../../services/inbody.service';
import { clientsService, type Client } from '../../services/clients.service';
import { ArrowLeft } from 'lucide-react';

const InBodyScanForm: React.FC = () => {
    const navigate = useNavigate();
    const { scanId } = useParams<{ scanId?: string }>();
    const isEdit = Boolean(scanId);

    const [clients, setClients] = useState<Client[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    const initialFormState: CreateInBodyScanInput = {
        clientId: '',
        scanDate: new Date().toISOString().split('T')[0],
        weight: 0,
        bodyFatMass: 0,
        skeletalMuscleMass: 0,
        bodyFatPercentage: 0,
        notes: '',
    };
    const [formData, setFormData] = useState<CreateInBodyScanInput>(initialFormState);

    useEffect(() => {
        fetchClients();
        if (isEdit && scanId) {
            fetchScan();
        }
    }, []);

    const fetchClients = async () => {
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        }
    };

    const fetchScan = async () => {
        if (!scanId) return;
        try {
            const scan = await inbodyService.getAll();
            const found = scan.find(s => s.id === scanId);
            if (found) {
                setFormData({
                    clientId: found.clientId,
                    scanDate: found.scanDate,
                    weight: found.weight,
                    bodyFatMass: found.bodyFatMass,
                    skeletalMuscleMass: found.skeletalMuscleMass,
                    bodyFatPercentage: found.bodyFatPercentage,
                    rightArmMuscle: found.rightArmMuscle || undefined,
                    leftArmMuscle: found.leftArmMuscle || undefined,
                    trunkMuscle: found.trunkMuscle || undefined,
                    rightLegMuscle: found.rightLegMuscle || undefined,
                    leftLegMuscle: found.leftLegMuscle || undefined,
                    bmr: found.bmr || undefined,
                    visceralFatLevel: found.visceralFatLevel || undefined,
                    bodyWater: found.bodyWater || undefined,
                    protein: found.protein || undefined,
                    mineral: found.mineral || undefined,
                    notes: found.notes || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch scan', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit && scanId) {
                await inbodyService.update(scanId, formData);
            } else {
                await inbodyService.create(formData);
            }
            navigate('/inbody');
        } catch (error) {
            console.error('Failed to save scan', error);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        outline: 'none',
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/inbody')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to InBody Scans
                </button>
                <PageHeader
                    title={isEdit ? 'Edit InBody Scan' : 'New InBody Scan'}
                    description="Record body composition measurements"
                />
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Client Selection */}
                    {!isEdit && (
                        <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                Client *
                            </label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="">Select client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.firstName} {client.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Core Measurements */}
                    <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Core Measurements</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Scan Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.scanDate}
                                    onChange={e => setFormData({ ...formData, scanDate: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Weight (kg) *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.weight || ''}
                                    onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Body Fat % *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.bodyFatPercentage || ''}
                                    onChange={e => {
                                        const percentage = parseFloat(e.target.value);
                                        const mass = formData.weight ? (formData.weight * percentage / 100) : 0;
                                        setFormData({
                                            ...formData,
                                            bodyFatPercentage: percentage,
                                            bodyFatMass: parseFloat(mass.toFixed(1))
                                        });
                                    }}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Body Fat Mass (kg) *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.bodyFatMass || ''}
                                    onChange={e => setFormData({ ...formData, bodyFatMass: parseFloat(e.target.value) })}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                    Auto-calculated from weight & body fat %
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Skeletal Muscle Mass (kg) *
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={formData.skeletalMuscleMass || ''}
                                onChange={e => setFormData({ ...formData, skeletalMuscleMass: parseFloat(e.target.value) })}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Advanced Metrics */}
                    <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Advanced Metrics (Optional)</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    BMR (kcal/day)
                                </label>
                                <input
                                    type="number"
                                    value={formData.bmr || ''}
                                    onChange={e => setFormData({ ...formData, bmr: e.target.value ? parseInt(e.target.value) : undefined })}
                                    style={inputStyle}
                                    placeholder="Basal Metabolic Rate"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Visceral Fat Level
                                </label>
                                <input
                                    type="number"
                                    value={formData.visceralFatLevel || ''}
                                    onChange={e => setFormData({ ...formData, visceralFatLevel: e.target.value ? parseInt(e.target.value) : undefined })}
                                    style={inputStyle}
                                    placeholder="1-20 scale"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Body Water (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.bodyWater || ''}
                                    onChange={e => setFormData({ ...formData, bodyWater: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Protein (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.protein || ''}
                                    onChange={e => setFormData({ ...formData, protein: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Mineral (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.mineral || ''}
                                    onChange={e => setFormData({ ...formData, mineral: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Segmental Muscle Analysis */}
                    <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Segmental Muscle Analysis (Optional)</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Right Arm (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.rightArmMuscle || ''}
                                    onChange={e => setFormData({ ...formData, rightArmMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Left Arm (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.leftArmMuscle || ''}
                                    onChange={e => setFormData({ ...formData, leftArmMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Trunk (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.trunkMuscle || ''}
                                    onChange={e => setFormData({ ...formData, trunkMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                            <div></div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Right Leg (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.rightLegMuscle || ''}
                                    onChange={e => setFormData({ ...formData, rightLegMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Left Leg (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.leftLegMuscle || ''}
                                    onChange={e => setFormData({ ...formData, leftLegMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                            placeholder="Any observations or notes..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/inbody')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: 'var(--border-radius-md)',
                                border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.6 : 1,
                            }}
                        >
                            {saving ? 'Saving...' : isEdit ? 'Update Scan' : 'Create Scan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InBodyScanForm;
