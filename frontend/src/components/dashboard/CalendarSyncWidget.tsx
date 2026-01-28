import React, { useState, useEffect } from 'react';
import { Calendar, Copy, RefreshCw, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CalendarSyncWidget: React.FC = () => {
    const { user } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchToken();
    }, []);

    const fetchToken = async () => {
        try {
            const res = await api.get('/calendar/token');
            setToken(res.data.token);
        } catch (err) {
            console.error('Failed to fetch calendar token', err);
        } finally {
            setLoading(false);
        }
    };

    const generateToken = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/calendar/token', {});
            setToken(res.data.token);
        } catch (err) {
            console.error('Failed to generate calendar token', err);
            alert('Failed to generate calendar token');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!feedUrl) return;
        navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const feedUrl = user && token
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/calendar/feed/${user.id}/${token}.ics`
        : '';

    if (loading) return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse h-40"></div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sync Calendar</h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Subscribe to your sessions in Google Calendar, Apple Calendar, or Outlook.
            </p>

            {token ? (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={feedUrl}
                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                            onClick={handleCopy}
                            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                            title="Copy URL"
                        >
                            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Private URL - Keep it secret</span>
                        <button
                            onClick={() => {
                                if (confirm('This will invalidate your current calendar link. Continue?')) {
                                    generateToken();
                                }
                            }}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            disabled={generating}
                        >
                            <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
                            Reset Link
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-2">
                    <button
                        onClick={generateToken}
                        disabled={generating}
                        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {generating ? 'Generating...' : 'Generate Calendar Link'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CalendarSyncWidget;
