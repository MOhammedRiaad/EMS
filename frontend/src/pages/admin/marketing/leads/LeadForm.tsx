import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { type CreateLeadDto } from '../../../../services/lead.service';
import { usersService, type User } from '../../../../services/users.service';

interface LeadFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateLeadDto) => Promise<void>;
    initialData?: Partial<CreateLeadDto>;
    title?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ isOpen, onClose, onSubmit, initialData, title = 'Add New Lead' }) => {
    const [formData, setFormData] = useState<CreateLeadDto>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: '',
        notes: '',
        assigned_to_id: undefined
    });
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await usersService.getAllUsers();
            // Filter out clients, only allow assigning to staff
            const staffUsers = data.filter(user => user.role !== 'client');
            setUsers(staffUsers);
        } catch (error) {
            console.error('Failed to load users', error);
        }
    };

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                assigned_to_id: initialData.assigned_to_id || undefined
            }));
        } else if (isOpen) {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                source: '',
                notes: '',
                assigned_to_id: undefined
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-800 animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
                            <select
                                value={formData.source}
                                onChange={e => setFormData({ ...formData, source: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Select Source...</option>
                                <option value="Website">Website</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Referral">Referral</option>
                                <option value="Walk-in">Walk-in</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                        <select
                            value={formData.assigned_to_id || ''}
                            onChange={e => setFormData({ ...formData, assigned_to_id: e.target.value || undefined })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            {loading ? 'Saving...' : <><Save size={18} /> Save Lead</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadForm;
