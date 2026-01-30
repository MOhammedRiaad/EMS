import React, { useState } from 'react';
import { ProgressGallery } from '../ProgressGallery';
import { Target, AlertCircle, Save, Plus, X, Activity, HeartPulse, Stethoscope } from 'lucide-react';
import { type Client } from '../../../services/clients.service';

interface HealthAndProgressTabProps {
    client: Client;
    onUpdate: (data: Partial<Client>) => Promise<void>;
}

interface InputFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    onEnter?: () => void;
    icon?: React.ElementType;
}

const InputField = ({ value, onChange, placeholder, onEnter, icon: Icon }: InputFieldProps) => (
    <div className="relative group">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />}
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
            placeholder={placeholder}
            className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-10 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none`}
        />
        <button
            onClick={onEnter}
            disabled={!value}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-md shadow-sm opacity-0 group-focus-within:opacity-100 disabled:opacity-0 transition-all hover:bg-gray-50 dark:hover:bg-slate-600"
        >
            <Plus size={14} />
        </button>
    </div>
);

const HealthAndProgressTab: React.FC<HealthAndProgressTabProps> = ({ client, onUpdate }) => {
    const [saving, setSaving] = useState(false);
    const [goals, setGoals] = useState(client.healthGoals || []);
    const [history, setHistory] = useState(client.medicalHistory || { allergies: [], injuries: [], conditions: [] });

    // Helper state for inputs
    const [newGoal, setNewGoal] = useState('');
    const [newAllergy, setNewAllergy] = useState('');
    const [newInjury, setNewInjury] = useState('');
    const [newCondition, setNewCondition] = useState('');

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate({
                healthGoals: goals,
                medicalHistory: history
            });
            // Ideally use a toast here instead of alert
            // But we'll keep it simple for now or assume a global toast provider exists
        } catch (error) {
            console.error('Failed to update health profile', error);
        } finally {
            setSaving(false);
        }
    };

    const addGoal = () => {
        if (!newGoal.trim()) return;
        setGoals([...goals, { id: Date.now().toString(), goal: newGoal, completed: false }]);
        setNewGoal('');
    };

    const toggleGoal = (id: string) => {
        setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
    };

    const removeGoal = (id: string) => {
        setGoals(goals.filter(g => g.id !== id));
    };

    const addHistoryItem = (field: 'allergies' | 'injuries' | 'conditions', value: string, setter: (s: string) => void) => {
        if (!value.trim()) return;
        setHistory({ ...history, [field]: [...(history[field] || []), value.trim()] });
        setter('');
    };

    const removeHistoryItem = (field: 'allergies' | 'injuries' | 'conditions', index: number) => {
        const newArr = [...(history[field] || [])];
        newArr.splice(index, 1);
        setHistory({ ...history, [field]: newArr });
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header Actions */}
            <div className="flex justify-end sticky top-0 z-10 bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-sm py-4 -my-4 px-4 -mx-4 border-b border-gray-200/50 dark:border-slate-800/50 mb-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Health Goals Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden isolate">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none -z-10" />

                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Health Goals</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage client fitness objectives</p>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="max-w-xl">
                        <InputField
                            value={newGoal}
                            onChange={setNewGoal}
                            onEnter={addGoal}
                            placeholder="Add a new goal..."
                            icon={Plus}
                        />
                    </div>

                    <div className="grid gap-3">
                        {goals.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
                                <p className="text-gray-400 dark:text-gray-500 text-sm">No goals set yet. Add one above to get started.</p>
                            </div>
                        )}
                        {goals.map(g => (
                            <div
                                key={g.id}
                                className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${g.completed
                                    ? 'bg-gray-50/50 dark:bg-slate-800/30 border border-transparent'
                                    : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleGoal(g.id)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${g.completed
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'border-gray-300 dark:border-slate-600 text-transparent hover:border-blue-400'
                                            }`}
                                    >
                                        <div className="w-2.5 h-2.5 bg-current rounded-full" />
                                    </button>
                                    <span className={`text-base font-medium transition-colors ${g.completed ? 'text-gray-400 line-through decoration-2 decoration-gray-200' : 'text-gray-700 dark:text-gray-200'
                                        }`}>
                                        {g.goal}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeGoal(g.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Medical History Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                <div className="flex items-center gap-4 mb-8 relative">
                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Medical History</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Important health conditions and considerations</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Allergies - Red Scheme */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={18} className="text-red-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">Allergies</h4>
                        </div>
                        <InputField
                            value={newAllergy}
                            onChange={setNewAllergy}
                            onEnter={() => addHistoryItem('allergies', newAllergy, setNewAllergy)}
                            placeholder="Add allergy"
                        />
                        <div className="flex flex-wrap gap-2 min-h-[60px] content-start">
                            {history.allergies?.map((item, i) => (
                                <span key={i} className="pl-3 pr-2 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium border border-red-100 dark:border-red-800/30 flex items-center gap-2 group">
                                    {item}
                                    <button onClick={() => removeHistoryItem('allergies', i)} className="text-red-400 hover:text-red-600">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {(!history.allergies || history.allergies.length === 0) && (
                                <span className="text-sm text-gray-400 italic">No allergies recorded</span>
                            )}
                        </div>
                    </div>

                    {/* Injuries - Orange Scheme */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Stethoscope size={18} className="text-orange-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">Injuries</h4>
                        </div>
                        <InputField
                            value={newInjury}
                            onChange={setNewInjury}
                            onEnter={() => addHistoryItem('injuries', newInjury, setNewInjury)}
                            placeholder="Add injury"
                        />
                        <div className="flex flex-wrap gap-2 min-h-[60px] content-start">
                            {history.injuries?.map((item, i) => (
                                <span key={i} className="pl-3 pr-2 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium border border-orange-100 dark:border-orange-800/30 flex items-center gap-2 group">
                                    {item}
                                    <button onClick={() => removeHistoryItem('injuries', i)} className="text-orange-400 hover:text-orange-600">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {(!history.injuries || history.injuries.length === 0) && (
                                <span className="text-sm text-gray-400 italic">No injuries recorded</span>
                            )}
                        </div>
                    </div>

                    {/* Conditions - Blue/Indigo Scheme */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HeartPulse size={18} className="text-indigo-500" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">Conditions</h4>
                        </div>
                        <InputField
                            value={newCondition}
                            onChange={setNewCondition}
                            onEnter={() => addHistoryItem('conditions', newCondition, setNewCondition)}
                            placeholder="Add condition"
                        />
                        <div className="flex flex-wrap gap-2 min-h-[60px] content-start">
                            {history.conditions?.map((item, i) => (
                                <span key={i} className="pl-3 pr-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-800/30 flex items-center gap-2 group">
                                    {item}
                                    <button onClick={() => removeHistoryItem('conditions', i)} className="text-indigo-400 hover:text-indigo-600">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {(!history.conditions || history.conditions.length === 0) && (
                                <span className="text-sm text-gray-400 italic">No conditions recorded</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ProgressGallery clientId={client.id} />
        </div>
    );
};

export default HealthAndProgressTab;
