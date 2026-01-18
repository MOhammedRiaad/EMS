import { useState, useEffect } from 'react';
import { coachPortalService } from '../../services/coach-portal.service';
import { Loader2, Plus, Trash2, Calendar, Save } from 'lucide-react';

const WEEKDAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const CoachAvailability = () => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            const data = await coachPortalService.getAvailability();
            setRules(data || []);
        } catch (error) {
            console.error('Failed to load availability', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await coachPortalService.updateAvailability(rules);
            alert('Availability saved successfully!');
        } catch (error) {
            console.error('Failed to save availability', error);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const addRule = () => {
        setRules([...rules, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, field: string, value: any) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setRules(newRules);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Availability</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save
                </button>
            </header>

            <div className="space-y-4">
                {rules.map((rule, index) => (
                    <div key={index} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                                <Calendar size={18} />
                                <span>Shift {index + 1}</span>
                            </div>
                            <button
                                onClick={() => removeRule(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Day</label>
                                <select
                                    value={rule.dayOfWeek}
                                    onChange={(e) => updateRule(index, 'dayOfWeek', parseInt(e.target.value))}
                                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                >
                                    {WEEKDAYS.map(day => (
                                        <option key={day.value} value={day.value}>{day.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={rule.startTime}
                                        onChange={(e) => updateRule(index, 'startTime', e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={rule.endTime}
                                        onChange={(e) => updateRule(index, 'endTime', e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addRule}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    <Plus size={20} />
                    Add Shift
                </button>
            </div>

            <p className="text-xs text-center text-gray-400">
                Changes apply to future sessions. Existing sessions are not affected.
            </p>
        </div>
    );
};

export default CoachAvailability;
