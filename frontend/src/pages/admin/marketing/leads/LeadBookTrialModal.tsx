import React, { useState, useEffect } from 'react';
import { X, Package, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { leadService } from '../../../../services/lead.service';
import { api } from '../../../../services/api';
import dayjs from 'dayjs';

interface LeadBookTrialModalProps {
    open: boolean;
    onClose: () => void;
    leadId: string;
    onSuccess: () => void;
}

export const LeadBookTrialModal: React.FC<LeadBookTrialModalProps> = ({
    open,
    onClose,
    leadId,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Package State
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');

    // Session State
    const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [time, setTime] = useState<string>('10:00');
    const [duration, setDuration] = useState<number>(20);
    const [studioId, setStudioId] = useState<string>('');
    const [roomId, setRoomId] = useState<string>('');
    const [coachId, setCoachId] = useState<string>('');

    // Dropdown Data
    const [studios, setStudios] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [coaches, setCoaches] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            setStep(1);
            setError(null);
            setSuccessMsg(null);
            fetchPackages();
            fetchStudios();
        }
    }, [open]);

    useEffect(() => {
        if (studioId) {
            fetchRooms(studioId);
            fetchCoaches(studioId);
            // Reset dependent fields if studio changes
            // logic to keep selection if valid ommitted for simplicity, just reset
            // Assuming we want fresh selection if studio changes
            // Actually, don't hard reset if just mounting, but typically UI resets
        }
    }, [studioId]);

    const fetchPackages = async () => {
        try {
            const res = await api.get('/packages');
            setPackages(res.data || []);
        } catch (error) {
            console.error('Failed to fetch packages', error);
        }
    };

    const fetchStudios = async () => {
        try {
            const res = await api.get('/studios');
            setStudios(res.data || []);
            if (res.data && res.data.length > 0 && !studioId) {
                setStudioId(res.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch studios', error);
        }
    };

    const fetchRooms = async (sId: string) => {
        try {
            const res = await api.get(`/rooms?studioId=${sId}`);
            setRooms(res.data || []);
            if (res.data && res.data.length > 0) {
                if (!rooms.find(r => r.id === roomId)) {
                    setRoomId(res.data[0].id);
                }
            } else {
                setRoomId('');
            }
        } catch (error) {
            console.error('Failed to fetch rooms', error);
        }
    };

    const fetchCoaches = async (sId: string) => {
        try {
            const res = await api.get(`/coaches?studioId=${sId}`);
            setCoaches(res.data || []);
            if (res.data && res.data.length > 0) {
                if (!coaches.find(c => c.id === coachId)) {
                    setCoachId(res.data[0].id);
                }
            } else {
                setCoachId('');
            }
        } catch (error) {
            console.error('Failed to fetch coaches', error);
        }
    };

    const handleAssignPackage = async () => {
        if (!selectedPackageId) {
            setStep(2);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await leadService.assignPackage(leadId, { packageId: selectedPackageId });
            // Don't show success msg yet, just move to next step
            setStep(2);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to assign package');
        } finally {
            setLoading(false);
        }
    };

    const handleBookSession = async () => {
        if (!date || !time || !studioId || !roomId || !coachId) {
            setError('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const startDateTime = dayjs(`${date}T${time}`);
            const endDateTime = startDateTime.add(duration, 'minute');

            await leadService.bookTrial(leadId, {
                studioId,
                roomId,
                coachId,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                type: 'individual',
                notes: 'Trial Session',
            });

            setSuccessMsg('Trial session booked successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to book session');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-800 animate-fade-in-up flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Book Trial Session</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Step {step} of 2: {step === 1 ? 'Assign Package' : 'Book Session'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm flex items-center gap-2">
                            <Check size={16} />
                            {successMsg}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3">
                                <div className="text-blue-600 dark:text-blue-400 mt-1">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Assign a Trial Package</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Select a package to cover this trial session. You can skip this step if the lead already has a package or if you want to book without one.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Package (Optional)
                                </label>
                                <select
                                    value={selectedPackageId}
                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                >
                                    <option value="">None (Skip)</option>
                                    {packages.map((pkg) => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} ({pkg.price} {pkg.currency}) - {pkg.totalSessions} Sessions
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Studio</label>
                                <select
                                    value={studioId}
                                    onChange={(e) => setStudioId(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                >
                                    {studios.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room</label>
                                    <select
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        disabled={!studioId}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {rooms.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coach</label>
                                    <select
                                        value={coachId}
                                        onChange={(e) => setCoachId(e.target.value)}
                                        disabled={!studioId}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {coaches.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.user?.firstName} {c.user?.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (minutes)</label>
                                <input
                                    type="number"
                                    min="10"
                                    step="5"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 20)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl">
                    {step === 1 ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-2"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                    )}

                    {step === 1 ? (
                        <button
                            onClick={handleAssignPackage}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : (selectedPackageId ? 'Assign & Continue' : 'Skip & Continue')} <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleBookSession}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Booking...' : 'Confirm Booking'} <Check size={16} />
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
