

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Clock, ArrowDown } from 'lucide-react';
import {
    automationService,
    AutomationTriggerType,
    AutomationActionType,
    type AutomationRule,
    type CreateAutomationRuleDto
} from '../../../../services/automation.service';

interface AutomationActionStep {
    id: string;
    type: AutomationActionType;
    delayMinutes: number;
    payload: string; // JSON string for editing
}

interface AutomationRuleEditorProps {
    rule?: AutomationRule;
    onClose: () => void;
    onSave: () => void;
}

const AutomationRuleEditor: React.FC<AutomationRuleEditorProps> = ({ rule, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState<AutomationTriggerType>(AutomationTriggerType.NEW_LEAD);
    const [conditions, setConditions] = useState<string>('{}');
    const [actions, setActions] = useState<AutomationActionStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (rule) {
            setName(rule.name);
            setTriggerType(rule.triggerType);
            setConditions(JSON.stringify(rule.conditions || {}, null, 2));

            if (rule.actions && rule.actions.length > 0) {
                setActions(rule.actions.map(a => ({
                    id: a.id || crypto.randomUUID(),
                    type: a.type,
                    delayMinutes: a.delayMinutes,
                    payload: JSON.stringify(a.payload || {}, null, 2)
                })));
            } else if (rule.actionType) {
                // Migrate legacy single action to first step
                setActions([{
                    id: crypto.randomUUID(),
                    type: rule.actionType,
                    delayMinutes: 0,
                    payload: JSON.stringify(rule.actionPayload || {}, null, 2)
                }]);
            } else {
                setActions([]);
            }
        } else {
            // Defaults for new rule
            setName('');
            setTriggerType(AutomationTriggerType.NEW_LEAD);
            setConditions('{}');
            setActions([{
                id: crypto.randomUUID(),
                type: AutomationActionType.SEND_EMAIL,
                delayMinutes: 0,
                payload: JSON.stringify({
                    subject: 'Welcome!',
                    template: 'welcome_email',
                    to: '{{lead.email}}'
                }, null, 2)
            }]);
        }
    }, [rule]);

    const addAction = () => {
        setActions([...actions, {
            id: crypto.randomUUID(),
            type: AutomationActionType.SEND_EMAIL,
            delayMinutes: 0,
            payload: '{}'
        }]);
    };

    const removeAction = (id: string) => {
        setActions(actions.filter(a => a.id !== id));
    };

    const updateAction = (id: string, field: keyof AutomationActionStep, value: any) => {
        setActions(actions.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate JSONs
            let parsedConditions;
            try {
                parsedConditions = JSON.parse(conditions);
            } catch (jsonErr) {
                throw new Error('Invalid JSON in Conditions');
            }

            const parsedActions = actions.map((action, index) => {
                try {
                    return {
                        id: action.id,
                        type: action.type,
                        delayMinutes: Number(action.delayMinutes),
                        payload: JSON.parse(action.payload),
                        order: index
                    };
                } catch (e) {
                    throw new Error(`Invalid JSON in Action #${index + 1}`);
                }
            });

            const dto: CreateAutomationRuleDto = {
                name,
                triggerType,
                conditions: parsedConditions,
                actions: parsedActions,
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
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                rows={2}
                            />
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Action Sequence</h3>

                            <div className="space-y-4">
                                {actions.map((action, index) => (
                                    <div key={action.id} className="relative">
                                        {index > 0 && (
                                            <div className="flex justify-center py-2">
                                                <ArrowDown className="text-gray-300 dark:text-gray-600" size={20} />
                                            </div>
                                        )}

                                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all hover:border-purple-300 dark:hover:border-purple-700">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Step {index + 1}</h4>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAction(action.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Remove Step"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Delay (Minutes)</label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={action.delayMinutes}
                                                            onChange={(e) => updateAction(action.id, 'delayMinutes', parseInt(e.target.value) || 0)}
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-4">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action Type</label>
                                                    <select
                                                        value={action.type}
                                                        onChange={(e) => updateAction(action.id, 'type', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                                    >
                                                        {Object.values(AutomationActionType).map((a) => (
                                                            <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="md:col-span-5">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Configuration (JSON)</label>
                                                    <textarea
                                                        value={action.payload}
                                                        onChange={(e) => updateAction(action.id, 'payload', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-xs h-[100px] bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addAction}
                                className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                <span>Add Next Step</span>
                            </button>
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
                        {loading ? 'Saving...' : 'Save Sequence'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutomationRuleEditor;


