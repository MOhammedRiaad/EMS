import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Zap, Play, Pause } from 'lucide-react';
import { automationService, type AutomationRule } from '../../../../services/automation.service';
import AutomationRuleEditor from './AutomationRuleEditor.tsx';

import AutomationExamplesModal from './AutomationExamplesModal';
import { BookOpen } from 'lucide-react';

const AutomationList: React.FC = () => {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isExamplesOpen, setIsExamplesOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<AutomationRule | undefined>(undefined);

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            const data = await automationService.getAll();
            setRules(data);
        } catch (error) {
            console.error('Failed to load automation rules', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this rule?')) {
            try {
                await automationService.delete(id);
                loadRules();
            } catch (error) {
                console.error('Failed to delete rule', error);
            }
        }
    };

    const handleEdit = (rule: AutomationRule) => {
        setSelectedRule(rule);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setSelectedRule(undefined);
        setIsEditorOpen(true);
    };

    const handleUseTemplate = (template: any) => {
        // Map template structure to what AutomationRuleEditor expects
        // Assuming template object matches the expected partial rule structure
        setSelectedRule({
            ...template,
            // Ensure ID is undefined so it creates a new one
            id: undefined,
            name: `${template.title} (Copy)`,
            isActive: true
        } as unknown as AutomationRule);
        setIsExamplesOpen(false);
        setIsEditorOpen(true);
    };

    const handleSave = async () => {
        await loadRules();
        setIsEditorOpen(false);
    };

    const toggleActive = async (rule: AutomationRule) => {
        try {
            await automationService.update(rule.id, { isActive: !rule.isActive });
            loadRules();
        } catch (error) {
            console.error('Failed to update rule status', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading automations...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Automation Rules</h2>
                    <p className="text-sm text-muted-foreground">Manage automatic actions based on triggers</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsExamplesOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                    >
                        <BookOpen size={18} />
                        <span>Examples</span>
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={18} />
                        <span>New Rule</span>
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-auto flex-1">
                {rules.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed border-border">
                        <Zap size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No automation rules yet</h3>
                        <p className="mb-4">Create your first rule to automate tasks</p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setIsExamplesOpen(true)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                View Examples
                            </button>
                            <button
                                onClick={handleCreate}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
                            >
                                Create Rule
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rules.map((rule) => (
                            <div key={rule.id} className={`bg-card rounded-lg border ${rule.isActive ? 'border-border' : 'border-border opacity-75'} shadow-sm hover:shadow-md transition-shadow`}>
                                <div className="p-4 border-b border-border flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${rule.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                            <Zap size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground">{rule.name}</h3>
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">{rule.triggerType}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(rule)}
                                            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-1.5 hover:bg-red-50 rounded-md text-red-500 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-center text-sm mb-4">
                                        <span className="text-muted-foreground">Action:</span>
                                        <span className="font-medium px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                                            {rule.actionType.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                        <span className={`text-xs flex items-center gap-1 ${rule.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                            {rule.isActive ? <Play size={12} /> : <Pause size={12} />}
                                            {rule.isActive ? 'Active' : 'Paused'}
                                        </span>
                                        <button
                                            onClick={() => toggleActive(rule)}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            {rule.isActive ? 'Pause' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isEditorOpen && (
                <AutomationRuleEditor
                    rule={selectedRule}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSave}
                />
            )}

            <AutomationExamplesModal
                isOpen={isExamplesOpen}
                onClose={() => setIsExamplesOpen(false)}
                onUseTemplate={handleUseTemplate}
            />
        </div>
    );
};

export default AutomationList;
