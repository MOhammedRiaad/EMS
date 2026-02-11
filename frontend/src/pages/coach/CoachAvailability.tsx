import { useState, useEffect } from 'react';
import { coachPortalService } from '../../services/coach-portal.service';
import { authenticatedFetch } from '../../services/api';
import { Loader2, Plus, Trash2, Calendar, Save, Clock, Check, X, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

interface TimeOffRequest {
    id: string;
    startDate: string;
    endDate: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: string;
    createdAt: string;
}

const CoachAvailability = () => {
    const { tenant } = useAuth();
    const [activeTab, setActiveTab] = useState<'weekly' | 'time-off'>('weekly');

    // Weekly Availability State
    const [rules, setRules] = useState<any[]>([]);
    const [loadingRules, setLoadingRules] = useState(true);
    const [savingRules, setSavingRules] = useState(false);

    // Time Off State
    const [requests, setRequests] = useState<TimeOffRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [showTimeOffForm, setShowTimeOffForm] = useState(false);
    const [submittingTimeOff, setSubmittingTimeOff] = useState(false);
    const [timeOffForm, setTimeOffForm] = useState({
        startDate: '',
        endDate: '',
        notes: ''
    });

    const canEditAvailability = tenant?.settings?.allowCoachSelfEditAvailability === true;

    useEffect(() => {
        loadAvailability();
    }, []);

    useEffect(() => {
        if (activeTab === 'time-off') {
            loadTimeOffRequests();
        }
    }, [activeTab]);

    const loadAvailability = async () => {
        try {
            setLoadingRules(true);
            const data = await coachPortalService.getAvailability();
            setRules(normalizeRules(data || []));
        } catch (error) {
            console.error('Failed to load availability', error);
        } finally {
            setLoadingRules(false);
        }
    };

    const loadTimeOffRequests = async () => {
        try {
            setLoadingRequests(true);
            const data = await authenticatedFetch('/coach-portal/time-off');
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load time-off requests:', err);
            setRequests([]);
        } finally {
            setLoadingRequests(false);
        }
    };

    // --- Weekly Logic ---

    const handleSaveRules = async () => {
        if (!canEditAvailability) return;
        setSavingRules(true);
        try {
            await coachPortalService.updateAvailability(rules);
            alert('Availability saved successfully!');
        } catch (error) {
            console.error('Failed to save availability', error);
            alert('Failed to save changes.');
        } finally {
            setSavingRules(false);
        }
    };

    const addRule = () => {
        if (!canEditAvailability) return;
        setRules([...rules, { dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', available: true }]);
    };

    const removeRule = (index: number) => {
        if (!canEditAvailability) return;
        setRules(rules.filter((_, i) => i !== index));
    };

    const updateRule = (index: number, field: string, value: any) => {
        if (!canEditAvailability) return;
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setRules(newRules);
    };

    // --- Time Off Logic ---

    const handleSubmitTimeOff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!timeOffForm.startDate || !timeOffForm.endDate) return;

        try {
            setSubmittingTimeOff(true);
            await authenticatedFetch('/coach-portal/time-off', {
                method: 'POST',
                body: JSON.stringify(timeOffForm)
            });
            setTimeOffForm({ startDate: '', endDate: '', notes: '' });
            setShowTimeOffForm(false);
            loadTimeOffRequests();
        } catch (err) {
            console.error('Failed to submit request:', err);
            alert('Failed to submit time-off request');
        } finally {
            setSubmittingTimeOff(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full flex items-center gap-1"><Check size={12} /> Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs rounded-full flex items-center gap-1"><X size={12} /> Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded-full flex items-center gap-1"><Clock size={12} /> Pending</span>;
        }
    };

    if (loadingRules && activeTab === 'weekly') return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="p-4 space-y-6 pb-20 max-w-4xl mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Availability & Time Off</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your weekly schedule and time-off requests</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-md">
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'weekly'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Weekly Schedule
                </button>
                <button
                    onClick={() => setActiveTab('time-off')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'time-off'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Time Off Requests
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'weekly' ? (
                <div className="space-y-4 animate-fade-in">

                    {!canEditAvailability && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 flex items-center gap-3">
                            <Lock size={20} className="text-amber-600 dark:text-amber-400" />
                            <div>
                                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Editing Locked</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-500">
                                    Your administrator manages your availability. Please contact them to request changes.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        {canEditAvailability && (
                            <button
                                onClick={handleSaveRules}
                                disabled={savingRules}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {savingRules ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        )}
                    </div>

                    {rules.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                            <Calendar className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">No active shifts defined.</p>
                        </div>
                    )}

                    {rules.map((rule, index) => (
                        <div key={index} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 ${!canEditAvailability ? 'opacity-75 pointer-events-none grayscale-[0.5]' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                                    <Calendar size={18} />
                                    <span>Shift {index + 1}</span>
                                </div>
                                {canEditAvailability && (
                                    <button
                                        onClick={() => removeRule(index)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Day</label>
                                    <select
                                        value={rule.dayOfWeek}
                                        onChange={(e) => updateRule(index, 'dayOfWeek', e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-900"
                                        disabled={!canEditAvailability}
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
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-900"
                                        disabled={!canEditAvailability}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={rule.endTime}
                                        onChange={(e) => updateRule(index, 'endTime', e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-900"
                                        disabled={!canEditAvailability}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {canEditAvailability && (
                        <button
                            onClick={addRule}
                            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <Plus size={20} />
                            Add Shift
                        </button>
                    )}

                    <p className="text-xs text-center text-gray-400 pt-4">
                        Changes apply to future sessions. Existing sessions are not affected.
                    </p>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowTimeOffForm(!showTimeOffForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            {showTimeOffForm ? <X size={18} /> : <Plus size={18} />}
                            {showTimeOffForm ? 'Cancel Request' : 'New Request'}
                        </button>
                    </div>

                    {showTimeOffForm && (
                        <form onSubmit={handleSubmitTimeOff} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 space-y-4 animate-in slide-in-from-top-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-slate-800">Request Time Off</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={timeOffForm.startDate}
                                        onChange={(e) => setTimeOffForm(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={timeOffForm.endDate}
                                        onChange={(e) => setTimeOffForm(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                                <textarea
                                    value={timeOffForm.notes}
                                    onChange={(e) => setTimeOffForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                                    rows={3}
                                    placeholder="Reason for time off..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTimeOffForm(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingTimeOff}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submittingTimeOff ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
                        <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Time-off requests need admin approval. You cannot be booked for sessions during approved time-off.
                        </p>
                    </div>

                    {loadingRequests ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                            <Calendar className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No time-off requests found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map(request => (
                                <div key={request.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-500">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {new Date(request.startDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    <span className="mx-2 text-gray-400">to</span>
                                                    {new Date(request.endDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Requested on {new Date(request.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>
                                    {request.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pl-11 border-l-2 border-gray-100 dark:border-slate-700 ml-2">
                                            "{request.notes}"
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CoachAvailability;
