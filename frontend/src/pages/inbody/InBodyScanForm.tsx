import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { inbodyService, type CreateInBodyScanInput } from '../../services/inbody.service';
import { clientsService, type Client } from '../../services/clients.service';
import { ArrowLeft, Save, X } from 'lucide-react';

const InBodyScanForm: React.FC = () => {
    const navigate = useNavigate();
    const { scanId, clientId } = useParams<{ scanId?: string; clientId?: string }>();
    const isEdit = Boolean(scanId);

    const [clients, setClients] = useState<Client[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    const initialFormState: CreateInBodyScanInput = {
        clientId: clientId || '',
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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">
            {title}
        </h3>
    );

    const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );

    const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input
            {...props}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
        />
    );

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => clientId ? navigate(`/coach/clients/${clientId}`) : navigate('/inbody')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>{clientId ? 'Back to Client' : 'Back to List'}</span>
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEdit ? 'Edit InBody Scan' : 'New InBody Scan'}
                        </h1>
                        <p className="text-gray-500 mt-1">Record body composition analysis data</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                    {/* Client Selection */}
                    {!isEdit && (
                        <div className="mb-8">
                            <Label required>Client</Label>
                            {clientId ? (
                                <div className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                                    {clients.find(c => c.id === clientId)?.firstName} {clients.find(c => c.id === clientId)?.lastName}
                                    <span className="text-xs text-gray-400 ml-2">(Pre-selected)</span>
                                </div>
                            ) : (
                                <select
                                    required
                                    value={formData.clientId}
                                    onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select a client...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.firstName} {client.lastName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    <SectionHeader title="Core Measurements" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label required>Scan Date</Label>
                            <Input
                                type="date"
                                required
                                value={formData.scanDate}
                                onChange={e => setFormData({ ...formData, scanDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label required>Weight (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                required
                                value={formData.weight || ''}
                                onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                                placeholder="0.0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label required>Body Fat %</Label>
                            <div className="relative">
                                <Input
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
                                    placeholder="0.0"
                                />
                                <span className="absolute right-4 top-2.5 text-gray-400 text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <Label required>Body Fat Mass (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                required
                                value={formData.bodyFatMass || ''}
                                onChange={e => setFormData({ ...formData, bodyFatMass: parseFloat(e.target.value) })}
                                placeholder="0.0"
                            />
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                Auto-calculated from weight & body fat %
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <Label required>Skeletal Muscle Mass (kg)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            required
                            value={formData.skeletalMuscleMass || ''}
                            onChange={e => setFormData({ ...formData, skeletalMuscleMass: parseFloat(e.target.value) })}
                            placeholder="0.0"
                        />
                    </div>
                </div>

                {/* Secondary Metrics Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                    <SectionHeader title="Advanced Metrics (Optional)" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label>BMR (kcal)</Label>
                            <Input
                                type="number"
                                value={formData.bmr || ''}
                                onChange={e => setFormData({ ...formData, bmr: e.target.value ? parseInt(e.target.value) : undefined })}
                                placeholder="Basal Metabolic Rate"
                            />
                        </div>
                        <div>
                            <Label>Visceral Fat Level</Label>
                            <Input
                                type="number"
                                value={formData.visceralFatLevel || ''}
                                onChange={e => setFormData({ ...formData, visceralFatLevel: e.target.value ? parseInt(e.target.value) : undefined })}
                                placeholder="1-20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label>Body Water (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.bodyWater || ''}
                                onChange={e => setFormData({ ...formData, bodyWater: e.target.value ? parseFloat(e.target.value) : undefined })}
                            />
                        </div>
                        <div>
                            <Label>Protein (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.protein || ''}
                                onChange={e => setFormData({ ...formData, protein: e.target.value ? parseFloat(e.target.value) : undefined })}
                            />
                        </div>
                        <div>
                            <Label>Mineral (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.mineral || ''}
                                onChange={e => setFormData({ ...formData, mineral: e.target.value ? parseFloat(e.target.value) : undefined })}
                            />
                        </div>
                    </div>
                </div>

                {/* Segmental Analysis Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                    <SectionHeader title="Segmental Muscle Analysis (kg)" />

                    <div className="grid grid-cols-3 gap-4 items-center justify-items-center max-w-lg mx-auto">
                        <div className="w-full">
                            <Label>Right Arm</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.rightArmMuscle || ''}
                                onChange={e => setFormData({ ...formData, rightArmMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="R. Arm"
                            />
                        </div>
                        <div className="pt-6">
                            {/* Head placeholder or trunk visual could go here, for now empty spacer */}
                        </div>
                        <div className="w-full">
                            <Label>Left Arm</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.leftArmMuscle || ''}
                                onChange={e => setFormData({ ...formData, leftArmMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="L. Arm"
                            />
                        </div>

                        <div className="col-span-3 w-1/2">
                            <Label>Trunk</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.trunkMuscle || ''}
                                onChange={e => setFormData({ ...formData, trunkMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="Trunk"
                            />
                        </div>

                        <div className="w-full">
                            <Label>Right Leg</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.rightLegMuscle || ''}
                                onChange={e => setFormData({ ...formData, rightLegMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="R. Leg"
                            />
                        </div>
                        <div></div>
                        <div className="w-full">
                            <Label>Left Leg</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={formData.leftLegMuscle || ''}
                                onChange={e => setFormData({ ...formData, leftLegMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                                placeholder="L. Leg"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes & Files */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                    <SectionHeader title="Attachments & Notes" />

                    <div className="mb-6">
                        <Label>Notes</Label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[100px]"
                            placeholder="Add any additional observations..."
                        />
                    </div>

                    <div>
                        <Label>Original Scan File</Label>
                        <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setFormData({ ...formData, file });
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="pointer-events-none">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formData.file ? formData.file.name : 'Click to upload scan file'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF or Image (Max 10MB)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 -mx-4 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3 rounded-t-xl">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Record'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InBodyScanForm;
