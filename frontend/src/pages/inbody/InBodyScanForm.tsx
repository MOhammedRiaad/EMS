import React from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useInBodyScanFormState } from './useInBodyScanFormState';
import { SectionHeader, Label, Input, Card } from './InBodyFormComponents';

const InBodyScanForm: React.FC = () => {
    const state = useInBodyScanFormState();

    if (state.loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={state.handleNavigateBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>{state.clientId ? 'Back to Client' : 'Back to List'}</span>
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {state.isEdit ? 'Edit InBody Scan' : 'New InBody Scan'}
                        </h1>
                        <p className="text-gray-500 mt-1">Record body composition analysis data</p>
                    </div>
                </div>
            </div>

            <form onSubmit={state.handleSubmit} className="space-y-6">
                {/* Main Card - Core Measurements */}
                <Card>
                    {/* Client Selection */}
                    {!state.isEdit && (
                        <ClientSelector
                            clients={state.clients}
                            clientId={state.clientId}
                            value={state.formData.clientId}
                            onChange={clientId => state.updateFormData({ clientId })}
                        />
                    )}

                    <SectionHeader title="Core Measurements" />
                    <CoreMeasurements
                        formData={state.formData}
                        onUpdate={state.updateFormData}
                        onUpdateBodyFat={state.updateBodyFatPercentage}
                    />
                </Card>

                {/* Secondary Metrics Card */}
                <Card>
                    <SectionHeader title="Advanced Metrics (Optional)" />
                    <AdvancedMetrics
                        formData={state.formData}
                        onUpdate={state.updateFormData}
                    />
                </Card>

                {/* Segmental Analysis Card */}
                <Card>
                    <SectionHeader title="Segmental Muscle Analysis (kg)" />
                    <SegmentalAnalysis
                        formData={state.formData}
                        onUpdate={state.updateFormData}
                    />
                </Card>

                {/* Notes & Files */}
                <Card>
                    <SectionHeader title="Attachments & Notes" />
                    <NotesAndFiles
                        notes={state.formData.notes || ''}
                        onNotesChange={notes => state.updateFormData({ notes })}
                        onFileChange={file => state.updateFormData({ file })}
                        fileName={state.formData.file?.name}
                    />
                </Card>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 -mx-4 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3 rounded-t-xl">
                    <button
                        type="button"
                        onClick={() => state.navigate(-1)}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={state.saving}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save size={18} />
                        {state.saving ? 'Saving...' : 'Save Record'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Sub-components
interface ClientSelectorProps {
    clients: Array<{ id: string; firstName: string; lastName: string }>;
    clientId?: string;
    value: string;
    onChange: (clientId: string) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ clients, clientId, value, onChange }) => (
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
                value={value}
                onChange={e => onChange(e.target.value)}
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
);

interface FormDataProps {
    formData: any;
    onUpdate: (updates: any) => void;
}

const CoreMeasurements: React.FC<FormDataProps & { onUpdateBodyFat: (val: number) => void }> = ({
    formData,
    onUpdate,
    onUpdateBodyFat
}) => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <Label required>Scan Date</Label>
                <Input
                    type="date"
                    required
                    value={formData.scanDate}
                    onChange={e => onUpdate({ scanDate: e.target.value })}
                />
            </div>
            <div>
                <Label required>Weight (kg)</Label>
                <Input
                    type="number"
                    step="0.1"
                    required
                    value={formData.weight || ''}
                    onChange={e => onUpdate({ weight: parseFloat(e.target.value) })}
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
                        onChange={e => onUpdateBodyFat(parseFloat(e.target.value))}
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
                    onChange={e => onUpdate({ bodyFatMass: parseFloat(e.target.value) })}
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
                onChange={e => onUpdate({ skeletalMuscleMass: parseFloat(e.target.value) })}
                placeholder="0.0"
            />
        </div>
    </>
);

const AdvancedMetrics: React.FC<FormDataProps> = ({ formData, onUpdate }) => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <Label>BMR (kcal)</Label>
                <Input
                    type="number"
                    value={formData.bmr || ''}
                    onChange={e => onUpdate({ bmr: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Basal Metabolic Rate"
                />
            </div>
            <div>
                <Label>Visceral Fat Level</Label>
                <Input
                    type="number"
                    value={formData.visceralFatLevel || ''}
                    onChange={e => onUpdate({ visceralFatLevel: e.target.value ? parseInt(e.target.value) : undefined })}
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
                    onChange={e => onUpdate({ bodyWater: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
            </div>
            <div>
                <Label>Protein (kg)</Label>
                <Input
                    type="number"
                    step="0.1"
                    value={formData.protein || ''}
                    onChange={e => onUpdate({ protein: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
            </div>
            <div>
                <Label>Mineral (kg)</Label>
                <Input
                    type="number"
                    step="0.1"
                    value={formData.mineral || ''}
                    onChange={e => onUpdate({ mineral: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
            </div>
        </div>
    </>
);

const SegmentalAnalysis: React.FC<FormDataProps> = ({ formData, onUpdate }) => (
    <div className="grid grid-cols-3 gap-4 items-center justify-items-center max-w-lg mx-auto">
        <div className="w-full">
            <Label>Right Arm</Label>
            <Input
                type="number"
                step="0.1"
                value={formData.rightArmMuscle || ''}
                onChange={e => onUpdate({ rightArmMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="R. Arm"
            />
        </div>
        <div className="pt-6"></div>
        <div className="w-full">
            <Label>Left Arm</Label>
            <Input
                type="number"
                step="0.1"
                value={formData.leftArmMuscle || ''}
                onChange={e => onUpdate({ leftArmMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="L. Arm"
            />
        </div>

        <div className="col-span-3 w-1/2">
            <Label>Trunk</Label>
            <Input
                type="number"
                step="0.1"
                value={formData.trunkMuscle || ''}
                onChange={e => onUpdate({ trunkMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Trunk"
            />
        </div>

        <div className="w-full">
            <Label>Right Leg</Label>
            <Input
                type="number"
                step="0.1"
                value={formData.rightLegMuscle || ''}
                onChange={e => onUpdate({ rightLegMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                onChange={e => onUpdate({ leftLegMuscle: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="L. Leg"
            />
        </div>
    </div>
);

interface NotesAndFilesProps {
    notes: string;
    onNotesChange: (notes: string) => void;
    onFileChange: (file: File) => void;
    fileName?: string;
}

const NotesAndFiles: React.FC<NotesAndFilesProps> = ({ notes, onNotesChange, onFileChange, fileName }) => (
    <>
        <div className="mb-6">
            <Label>Notes</Label>
            <textarea
                value={notes}
                onChange={e => onNotesChange(e.target.value)}
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
                            onFileChange(file);
                        }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {fileName || 'Click to upload scan file'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF or Image (Max 10MB)</p>
                </div>
            </div>
        </div>
    </>
);

export default InBodyScanForm;
