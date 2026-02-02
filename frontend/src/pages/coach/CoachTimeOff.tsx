import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '../../services/api';

interface TimeOffRequest {
    id: string;
    startDate: string;
    endDate: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: string;
    createdAt: string;
}

const CoachTimeOff: React.FC = () => {
    const [requests, setRequests] = useState<TimeOffRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        notes: ''
    });

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await authenticatedFetch('/coach-portal/time-off');
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load time-off requests:', err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate) return;

        try {
            setSubmitting(true);
            await authenticatedFetch('/coach-portal/time-off', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setFormData({ startDate: '', endDate: '', notes: '' });
            setShowForm(false);
            loadRequests();
        } catch (err) {
            console.error('Failed to submit request:', err);
            alert('Failed to submit time-off request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1"><Check size={12} /> Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1"><X size={12} /> Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1"><Clock size={12} /> Pending</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="text-blue-600" size={24} />
                    Time-Off Requests
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                    New Request
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Request Time Off</h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date & Time</label>
                            <input
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date & Time</label>
                            <input
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            rows={2}
                            placeholder="Reason for time off..."
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Submit Request
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Time-off requests need admin approval. You'll be notified once your request is reviewed.
                </p>
            </div>

            {/* Requests List */}
            {requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No time-off requests yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(request => (
                        <div key={request.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                    <Calendar size={14} className="text-gray-400" />
                                    {new Date(request.startDate).toLocaleString()} - {new Date(request.endDate).toLocaleString()}
                                </div>
                                {getStatusBadge(request.status)}
                            </div>
                            {request.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{request.notes}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                                Requested {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoachTimeOff;
