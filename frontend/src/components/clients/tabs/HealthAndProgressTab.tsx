import React, { useState } from 'react';
import { ProgressGallery } from '../ProgressGallery';
import { Target, AlertCircle, Save } from 'lucide-react';
import { clientsService, type Client } from '../../../services/clients.service';

interface HealthAndProgressTabProps {
    client: Client;
    onUpdate: (data: Partial<Client>) => Promise<void>;
}

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
            alert('Health profile updated');
        } catch (error) {
            console.error('Failed to update health profile', error);
            alert('Failed to update. Check console.');
        } finally {
            setSaving(false);
        }
    };

    const addGoal = () => {
        if (!newGoal) return;
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
        if (!value) return;
        setHistory({ ...history, [field]: [...(history[field] || []), value] });
        setter('');
    };

    const removeHistoryItem = (field: 'allergies' | 'injuries' | 'conditions', index: number) => {
        const newArr = [...(history[field] || [])];
        newArr.splice(index, 1);
        setHistory({ ...history, [field]: newArr });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="text-blue-500" />
                        Health Goals
                    </h2>
                    <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                        <Save size={16} /> Save Changes
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            placeholder="Add a new goal..."
                            className="flex-1 input-field"
                            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                        />
                        <button onClick={addGoal} className="btn-secondary">Add</button>
                    </div>

                    <div className="space-y-2">
                        {goals.length === 0 && <p className="text-gray-400 text-sm">No goals set yet.</p>}
                        {goals.map(g => (
                            <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={g.completed}
                                        onChange={() => toggleGoal(g.id)}
                                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className={g.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}>
                                        {g.goal}
                                    </span>
                                </div>
                                <button onClick={() => removeGoal(g.id)} className="text-gray-400 hover:text-red-500">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                    <AlertCircle className="text-red-500" />
                    Medical History
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Allergies */}
                    <div>
                        <h4 className="font-semibold mb-2">Allergies</h4>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newAllergy}
                                onChange={(e) => setNewAllergy(e.target.value)}
                                className="input-field text-sm"
                                placeholder="Add allergy"
                            />
                            <button onClick={() => addHistoryItem('allergies', newAllergy, setNewAllergy)} className="btn-secondary text-sm">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {history.allergies?.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs flex items-center gap-1">
                                    {item}
                                    <button onClick={() => removeHistoryItem('allergies', i)}>&times;</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Injuries */}
                    <div>
                        <h4 className="font-semibold mb-2">Injuries</h4>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newInjury}
                                onChange={(e) => setNewInjury(e.target.value)}
                                className="input-field text-sm"
                                placeholder="Add injury"
                            />
                            <button onClick={() => addHistoryItem('injuries', newInjury, setNewInjury)} className="btn-secondary text-sm">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {history.injuries?.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs flex items-center gap-1">
                                    {item}
                                    <button onClick={() => removeHistoryItem('injuries', i)}>&times;</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Conditions */}
                    <div>
                        <h4 className="font-semibold mb-2">Conditions</h4>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newCondition}
                                onChange={(e) => setNewCondition(e.target.value)}
                                className="input-field text-sm"
                                placeholder="Add condition"
                            />
                            <button onClick={() => addHistoryItem('conditions', newCondition, setNewCondition)} className="btn-secondary text-sm">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {history.conditions?.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs flex items-center gap-1">
                                    {item}
                                    <button onClick={() => removeHistoryItem('conditions', i)}>&times;</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ProgressGallery clientId={client.id} />
        </div>
    );
};

export default HealthAndProgressTab;
