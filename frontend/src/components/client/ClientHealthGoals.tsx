import React, { useState } from 'react';
import { Target, CheckCircle, Circle, Plus, X, Loader2 } from 'lucide-react';
import { clientPortalService } from '../../services/client-portal.service';
import confetti from 'canvas-confetti';

interface HealthGoal {
    id: string;
    goal: string;
    completed: boolean;
    targetDate?: string;
}

interface ClientHealthGoalsProps {
    goals?: HealthGoal[];
    onUpdate: () => void;
}

const ClientHealthGoals: React.FC<ClientHealthGoalsProps> = ({ goals = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newGoal, setNewGoal] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim()) return;

        setLoading(true);
        try {
            const goal: HealthGoal = {
                id: crypto.randomUUID(),
                goal: newGoal,
                completed: false,
                targetDate: targetDate || undefined
            };

            const updatedGoals = [...goals, goal];
            await clientPortalService.updateProfile({ healthGoals: updatedGoals });
            setNewGoal('');
            setTargetDate('');
            setIsAdding(false);
            onUpdate();
        } catch (err) {
            console.error('Failed to add goal', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleGoal = async (goalId: string) => {
        if (actionLoading) return;
        setActionLoading(goalId);

        const goal = goals.find(g => g.id === goalId);
        const isCompleting = !goal?.completed;

        const updatedGoals = goals.map(g =>
            g.id === goalId ? { ...g, completed: !g.completed } : g
        );

        try {
            await clientPortalService.updateProfile({ healthGoals: updatedGoals });

            if (isCompleting) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b'] // Blue, Green, Yellow
                });
            }

            onUpdate();
        } catch (err) {
            console.error('Failed to update goal', err);
        } finally {
            setActionLoading(null);
        }
    };

    const removeGoal = async (goalId: string) => {
        if (actionLoading) return;
        if (!confirm('Are you sure you want to remove this goal?')) return;

        setActionLoading(goalId);
        const updatedGoals = goals.filter(g => g.id !== goalId);

        try {
            await clientPortalService.updateProfile({ healthGoals: updatedGoals });
            onUpdate();
        } catch (err) {
            console.error('Failed to remove goal', err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                        <Target className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Health Goals</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track your fitness objectives</p>
                    </div>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                        <Plus size={16} /> Add Goal
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleAddGoal} className="mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            placeholder="What's your goal? (e.g., Run 5k)"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading || !newGoal.trim()}
                                className="flex-1 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                {loading ? 'Saving...' : 'Save Goal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {goals.length === 0 && !isAdding ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        No goals set yet. Start by adding one!
                    </div>
                ) : (
                    goals.map(goal => (
                        <div
                            key={goal.id}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all ${goal.completed
                                ? 'bg-green-50/50 dark:bg-green-900/10'
                                : 'bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <button
                                onClick={() => toggleGoal(goal.id)}
                                disabled={actionLoading === goal.id}
                                className={`mt-0.5 flex-shrink-0 transition-colors ${goal.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'
                                    } ${actionLoading === goal.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {actionLoading === goal.id ? (
                                    <Loader2 size={20} className="animate-spin text-blue-500" />
                                ) : goal.completed ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <Circle size={20} />
                                )}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${goal.completed
                                    ? 'text-gray-500 line-through dark:text-gray-400'
                                    : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {goal.goal}
                                </p>
                                {goal.targetDate && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => removeGoal(goal.id)}
                                disabled={actionLoading === goal.id}
                                className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClientHealthGoals;
