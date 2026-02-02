import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { Loader2, Plus, Trash2, Calendar, Save, ArrowLeft, User } from 'lucide-react';

const WEEKDAYS = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
];

const dayIndexToName: Record<number, string> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday'
};

const normalizeRules = (rules: any[]): any[] => {
    if (!rules || !Array.isArray(rules)) return [];
    return rules.map(rule => ({
        ...rule,
        dayOfWeek: typeof rule.dayOfWeek === 'number'
            ? dayIndexToName[rule.dayOfWeek] || 'monday'
            : String(rule.dayOfWeek).toLowerCase(),
        available: rule.available !== false
    }));
};

const CoachAvailabilityPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [coach, setCoach] = useState<CoachDisplay | null>(null);
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCoachAndAvailability();
    }, [id]);

    const loadCoachAndAvailability = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [coachData, availabilityData] = await Promise.all([
                coachesService.getAll().then(coaches => coaches.find(c => c.id === id)),
                coachesService.getAvailability(id)
            ]);
            if (coachData) {
                setCoach(coachData);
            }
            setRules(normalizeRules(availabilityData || []));
        } catch (err) {
            setError('Failed to load coach data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await coachesService.updateAvailability(id, rules);
            setError(null);
            alert('Availability saved successfully!');
        } catch (err) {
            setError('Failed to save availability');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const addRule = () => {
        setRules([...rules, { dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', available: true }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, field: string, value: any) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setRules(newRules);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!coach) {
        return (
            <div className="p-6 text-center text-red-500">
                Coach not found
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/coaches')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Coach Availability
                        </h1>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                            <User size={16} />
                            <span>{coach.firstName} {coach.lastName}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span>{coach.studioName}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </header>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Availability Rules */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar size={18} className="text-blue-600" />
                        Weekly Availability
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Define the working hours for this coach. Each shift represents a time block when they're available for sessions.
                    </p>
                </div>

                <div className="p-4 space-y-4">
                    {rules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No availability rules defined. Add shifts to set working hours.
                        </div>
                    ) : (
                        rules.map((rule, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 flex flex-col gap-3">
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

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Day</label>
                                        <select
                                            value={rule.dayOfWeek}
                                            onChange={(e) => updateRule(index, 'dayOfWeek', e.target.value)}
                                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                        >
                                            {WEEKDAYS.map(day => (
                                                <option key={day.value} value={day.value}>{day.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={rule.startTime}
                                            onChange={(e) => updateRule(index, 'startTime', e.target.value)}
                                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={rule.endTime}
                                            onChange={(e) => updateRule(index, 'endTime', e.target.value)}
                                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <button
                        onClick={addRule}
                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                        <Plus size={20} />
                        Add Shift
                    </button>
                </div>
            </div>

            <p className="text-xs text-center text-gray-400">
                Changes apply to future sessions. Existing sessions are not affected.
            </p>
        </div>
    );
};

export default CoachAvailabilityPage;
