import React, { useState } from 'react';
import { Send, Mail, MessageSquare, Users, Eye, X } from 'lucide-react';
import { ownerPortalService } from '../../../services/owner-portal.service';

interface BroadcastComposerProps {
    onSuccess: () => void;
}

const BroadcastComposer: React.FC<BroadcastComposerProps> = ({ onSuccess }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [targetAudience, setTargetAudience] = useState('ALL_TENANTS');
    const [type, setType] = useState('EMAIL');
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !body) return;

        if (!confirm('Are you sure you want to send this broadcast? This action cannot be undone.')) return;

        setLoading(true);
        try {
            // 1. Create Draft
            const draft = await ownerPortalService.createBroadcast({
                subject,
                body,
                targetAudience,
                type
            });

            // 2. Trigger Send
            await ownerPortalService.sendBroadcast(draft.id);

            alert('Broadcast sent successfully!');
            setSubject('');
            setBody('');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to send broadcast');
        } finally {
            setLoading(false);
        }
    };

    if (previewMode) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preview Message</h3>
                    <button onClick={() => setPreviewMode(false)} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="border-b pb-4">
                        <p className="text-sm text-gray-500">Subject</p>
                        <p className="font-medium text-lg dark:text-white">{subject}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Content</p>
                        <div className="prose dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-slate-900 rounded-lg whitespace-pre-wrap">
                            {body}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Send size={20} className="text-blue-500" /> New Broadcast
            </h3>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL_TENANTS">All Tenants (Users linked to Tenants)</option>
                                <option value="TENANT_OWNERS">Tenant Owners Only</option>
                                <option value="ALL_COACHES">All Coaches</option>
                                <option value="ALL_CLIENTS">All Clients</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setType('EMAIL')}
                                className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 transition-colors ${type === 'EMAIL' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700 text-gray-600'}`}
                            >
                                <Mail size={18} /> Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('SMS')}
                                // disabled // Enable later
                                className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 transition-colors ${type === 'SMS' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' : 'border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700 text-gray-600'}`}
                            >
                                <MessageSquare size={18} /> SMS
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Importance Notice: Maintenance Scheduled..."
                        className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Body</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your message here..."
                        className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => setPreviewMode(true)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                    >
                        <Eye size={18} /> Preview
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !subject || !body}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Sending...' : <><Send size={18} /> Send Broadcast</>}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default BroadcastComposer;
