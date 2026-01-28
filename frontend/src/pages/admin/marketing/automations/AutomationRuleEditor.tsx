import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import {
    automationService,
    AutomationTriggerType,
    AutomationActionType,
    type AutomationRule,
    type CreateAutomationRuleDto
} from '../../../../services/automation.service';

interface AutomationRuleEditorProps {
    rule?: AutomationRule;
    onClose: () => void;
    onSave: () => void;
}

const AutomationRuleEditor: React.FC<AutomationRuleEditorProps> = ({ rule, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState<AutomationTriggerType>(AutomationTriggerType.NEW_LEAD);
    const [actionType, setActionType] = useState<AutomationActionType>(AutomationActionType.SEND_EMAIL);
    const [conditions, setConditions] = useState<string>('{}');
    const [actionPayload, setActionPayload] = useState<string>('{}');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (rule) {
            setName(rule.name);
            setTriggerType(rule.triggerType);
            setActionType(rule.actionType);
            setConditions(JSON.stringify(rule.conditions || {}, null, 2));
            setActionPayload(JSON.stringify(rule.actionPayload || {}, null, 2));
        } else {
            // Defaults for new rule
            setName('');
            setTriggerType(AutomationTriggerType.NEW_LEAD);
            setActionType(AutomationActionType.SEND_EMAIL);
            setConditions('{}');
            setActionPayload(JSON.stringify({
                subject: 'Welcome!',
                template: 'welcome_email',
                to: '{{lead.email}}'
            }, null, 2));
        }
    }, [rule]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate JSON
            let parsedConditions;
            let parsedPayload;
            try {
                parsedConditions = JSON.parse(conditions);
                parsedPayload = JSON.parse(actionPayload);
            } catch (jsonErr) {
                throw new Error('Invalid JSON in Conditions or Action Payload');
            }

            const dto: CreateAutomationRuleDto = {
                name,
                triggerType,
                conditions: parsedConditions,
                actionType,
                actionPayload: parsedPayload,
                isActive: rule ? rule.isActive : true
            };

            if (rule) {
                await automationService.update(rule.id, dto);
            } else {
                await automationService.create(dto);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {rule ? 'Edit Automation Rule' : 'New Automation Rule'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form id="automation-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                placeholder="e.g. Welcome Email Sequence"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Trigger</label>
                                <select
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                >
                                    {Object.values(AutomationTriggerType).map((t) => (
                                        <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
                                <select
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value as AutomationActionType)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                >
                                    {Object.values(AutomationActionType).map((a) => (
                                        <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Conditions (JSON)
                                <span className="ml-2 text-xs text-muted-foreground">Filter when this trigger fires</span>
                            </label>
                            <textarea
                                value={conditions}
                                onChange={(e) => setConditions(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Action Payload (JSON)
                                <span className="ml-2 text-xs text-muted-foreground">Configuration for the action</span>
                            </label>
                            <textarea
                                value={actionPayload}
                                onChange={(e) => setActionPayload(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                rows={6}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                For Email: {"{ \"subject\": \"...\", \"template\": \"...\", \"to\": \"{{email}}\" }"}
                            </p>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="automation-form"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Rule'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutomationRuleEditor;
