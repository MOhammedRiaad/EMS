import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone, Search, X } from 'lucide-react';
import { api } from '../../../../services/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { clientsService, type Client } from '../../../../services/clients.service';
import { coachesService, type CoachDisplay } from '../../../../services/coaches.service';

interface Announcement {
    id: string;
    title: string;
    content: string;
    targetType: 'all' | 'clients' | 'coaches' | 'specific_users';
    targetUserIds?: string[];
    startDate: string;
    endDate?: string;
    isActive: boolean;
}

interface SelectableUser {
    id: string;
    name: string;
    type: 'client' | 'coach';
    email: string;
}

const AnnouncementManager: React.FC = () => {
    useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // User selection state
    const [availableUsers, setAvailableUsers] = useState<SelectableUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<SelectableUser[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetType: 'all',
        targetUserIds: [] as string[],
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });


    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Fetch users when target type changes to specific_users
    useEffect(() => {
        if (formData.targetType === 'specific_users') {
            fetchUsers();
        }
    }, [formData.targetType]);

    const fetchUsers = async () => {
        setIsUsersLoading(true);
        try {
            const [clients, coaches] = await Promise.all([
                clientsService.getAll(),
                coachesService.getAll()
            ]);

            const normalizedUsers: SelectableUser[] = [
                ...clients
                    .filter((c: Client) => c.userId) // Only clients with user accounts
                    .map((c: Client) => ({
                        id: c.userId!, // Use User ID
                        name: `${c.firstName} ${c.lastName} `,
                        type: 'client' as const,
                        email: c.email || ''
                    })),

                ...coaches
                    .filter((c: CoachDisplay) => c.userId)
                    .map((c: CoachDisplay) => ({
                        id: c.userId, // Use User ID
                        name: `${c.firstName} ${c.lastName} `,
                        type: 'coach' as const,
                        email: c.email
                    }))
            ];
            setAvailableUsers(normalizedUsers);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsUsersLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<Announcement[]>('/notifications/announcements');
            if (response.data) setAnnouncements(response.data);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserSelection = (user: SelectableUser) => {
        const isSelected = selectedUsers.find(u => u.id === user.id);
        let newSelected: SelectableUser[];

        if (isSelected) {
            newSelected = selectedUsers.filter(u => u.id !== user.id);
        } else {
            newSelected = [...selectedUsers, user];
        }

        setSelectedUsers(newSelected);
        setFormData({
            ...formData,
            targetUserIds: newSelected.map(u => u.id)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/notifications/announcements', {
                ...formData,
                endDate: formData.endDate || null,
                targetUserIds: formData.targetType === 'specific_users' ? formData.targetUserIds : undefined
            });
            setIsModalOpen(false);
            setFormData({
                title: '',
                content: '',
                targetType: 'all',
                targetUserIds: [],
                startDate: new Date().toISOString().split('T')[0],
                endDate: ''
            });
            setSelectedUsers([]);
            fetchAnnouncements();
        } catch (error) {
            console.error('Failed to create announcement', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await api.delete(`/notifications/announcements/${id}`);
            fetchAnnouncements();
        } catch (error) {
            console.error('Failed to delete announcement', error);
        }
    };

    const filteredUsers = availableUsers.filter(user =>
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="h-6 w-6 text-blue-600" />
                        Announcements
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage system-wide announcements for clients and coaches.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    New Announcement
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Target</th>
                            <th className="px-6 py-4">Start Date</th>
                            <th className="px-6 py-4">End Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    Loading announcements...
                                </td>
                            </tr>
                        ) : announcements.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No announcements found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            announcements.map((announcement) => (
                                <tr key={announcement.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{announcement.title}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{announcement.content}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-md font-medium w-fit">
                                                {announcement.targetType}
                                            </span>
                                            {announcement.targetType === 'specific_users' && announcement.targetUserIds && (
                                                <span className="text-[10px] text-gray-400">
                                                    {announcement.targetUserIds.length} users
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(announcement.startDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {announcement.endDate ? new Date(announcement.endDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(announcement.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Announcement</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (HTML allowed)</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="<p>Enter your announcement here...</p>"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                                    <select
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.targetType}
                                        onChange={e => setFormData({ ...formData, targetType: e.target.value as any })}
                                    >
                                        <option value="all">All Users</option>
                                        <option value="clients">Clients Only</option>
                                        <option value="coaches">Coaches Only</option>
                                        <option value="specific_users">Specific Users</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Specific User Selection */}
                            {formData.targetType === 'specific_users' && (
                                <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-lg p-3 bg-gray-50 dark:bg-slate-900/50">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Users</div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                                        {isUsersLoading ? (
                                            <div className="text-center py-4 text-xs text-gray-500">Loading users...</div>
                                        ) : filteredUsers.length > 0 ? (
                                            filteredUsers.map(user => (
                                                <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.some(u => u.id === user.id)}
                                                        onChange={() => toggleUserSelection(user)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span className={`capitalize ${user.type === 'coach' ? 'text-purple-600' : 'text-blue-600'} `}>{user.type}</span>
                                                            <span>•</span>
                                                            <span>{user.email}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-xs text-gray-500">No users found</div>
                                        )}
                                    </div>

                                    {/* Selected Summary */}
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                            {selectedUsers.map(user => (
                                                <span key={user.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                                    {user.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleUserSelection(user)}
                                                        className="hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/20"
                                >
                                    Create Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementManager;
