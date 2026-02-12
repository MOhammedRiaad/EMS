import React, { useEffect, useState } from 'react';
import {
    Users,
    UserPlus,
    Shield,
    X,
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { Role } from '../../services/owner-portal.service';

interface AdminUserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string; // API returns string key
    roles?: Role[]; // Future proofing
    lastLoginAt?: string;
    active: boolean;
    tenantName?: string;
}

interface AdminUser extends AdminUserResponse {
    roles: Role[]; // UI expects this
    // We will map 'role' string to this array if 'roles' is missing from API
}

const OwnerAdmins: React.FC = () => {
    // Note: In a real implementation, we would need an endpoint to list users in the owner tenant.

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const rolesData = await ownerPortalService.getAllRoles();
            setRoles(rolesData);

            // Fetch users with owner/admin roles
            // For now, we search for all users to display list, or specifically filter by role if backend supports
            // The new endpoint supports 'role', but we might want multiple. 
            // Let's list all users for now and we can filter client-side or assume the endpoint returns default list.
            const response = await ownerPortalService.searchUsers({ limit: 50 });

            // Map API response to UI model
            const mappedUsers: AdminUser[] = response.items.map((u: any) => {
                const userRoleKey = u.role;
                // Find role object matching the key
                const matchedRole = rolesData.find((r: { key: any; }) => r.key === userRoleKey);

                return {
                    ...u,
                    // If API doesn't return roles array, construct it from the single role key
                    roles: u.roles || (matchedRole ? [matchedRole] : []),
                };
            });

            setUsers(mappedUsers);

        } catch (error) {
            console.error('Failed to load admin users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (!term) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await ownerPortalService.searchUsers({ search: term, limit: 10 });
            // Map search results too
            const mappedResults: AdminUser[] = response.items.map((u: any) => {
                const userRoleKey = u.role;
                const matchedRole = roles.find(r => r.key === userRoleKey);
                return {
                    ...u,
                    roles: u.roles || (matchedRole ? [matchedRole] : []),
                };
            });
            setSearchResults(mappedResults);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAssignContextUser = (user: AdminUser) => {
        // If user is from search results, check if already in list
        if (!users.find(u => u.id === user.id)) {
            setUsers([...users, user]);
        }
        setSelectedUser(user);
        setShowRoleModal(true);
        setSearchResults([]); // Clear search suggestions
        setSearchTerm('');
    };

    const handleAssignRole = async (roleId: string) => {
        if (!selectedUser) return;
        try {
            // Optimistic update
            const role = roles.find(r => r.id === roleId);
            if (!role) return;

            const hasRole = selectedUser.roles.some(r => r.id === roleId);

            if (hasRole) {
                await ownerPortalService.revokeRoleFromUser(selectedUser.id, roleId);
                setUsers(users.map(u => u.id === selectedUser.id ? {
                    ...u,
                    roles: u.roles.filter(r => r.id !== roleId)
                } : u));
                setSelectedUser({
                    ...selectedUser,
                    roles: selectedUser.roles.filter(r => r.id !== roleId)
                });
            } else {
                await ownerPortalService.assignRoleToUser(selectedUser.id, roleId);
                setUsers(users.map(u => u.id === selectedUser.id ? {
                    ...u,
                    roles: [...u.roles, role]
                } : u));
                setSelectedUser({
                    ...selectedUser,
                    roles: [...selectedUser.roles, role]
                });
            }
        } catch (error) {
            console.error('Failed to toggle role', error);
            alert('Failed to update role assignment');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-blue-600" /> Owner Administrators
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage owner team access and roles</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users to add..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-4 pr-10 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {isSearching ? (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                searchTerm && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden max-h-64 overflow-y-auto">
                                <div className="p-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-700/50">
                                    Found Users
                                </div>
                                {searchResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleAssignContextUser(user)}
                                        className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-slate-700 last:border-0"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                            {user.firstName[0]}{user.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">{user.firstName} {user.lastName}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                        <UserPlus size={18} /> Invite Admin
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Tenant</th>
                            <th className="px-6 py-4 font-medium">Assigned Roles</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Last Login</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {user.firstName[0]}{user.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {user.tenantName || <span className="text-gray-400 italic">Global</span>}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles?.map(role => (
                                            <span key={role.id} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${role.isSystemRole
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                }`}>
                                                {role.name}
                                            </span>
                                        ))}
                                        {(!user.roles || user.roles.length === 0) && <span className="text-gray-400 text-xs italic">No roles</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.active ? (
                                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setShowRoleModal(true);
                                        }}
                                        className="text-gray-400 hover:text-blue-600 p-1"
                                        title="Manage Roles"
                                    >
                                        <Shield size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Role Management Modal */}
            {showRoleModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Roles</h3>
                                <p className="text-sm text-gray-500">For {selectedUser.firstName} {selectedUser.lastName}</p>
                            </div>
                            <button onClick={() => setShowRoleModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6">
                            {roles.map(role => {
                                const isAssigned = selectedUser.roles.some(r => r.id === role.id);
                                return (
                                    <div
                                        key={role.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${isAssigned ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'border-gray-100 dark:border-slate-700'}`}
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                {role.name}
                                                {role.isSystemRole && <span className="text-[10px] uppercase bg-gray-200 px-1.5 rounded text-gray-600">System</span>}
                                            </div>
                                            <div className="text-xs text-gray-500">{role.description}</div>
                                        </div>
                                        <button
                                            onClick={() => handleAssignRole(role.id)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isAssigned
                                                ? 'bg-blue-100 text-blue-700 hover:bg-red-100 hover:text-red-700'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                                                }`}
                                        >
                                            {isAssigned ? 'Assigned' : 'Assign'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal (Placeholder) */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Invite Owner Admin</h3>
                        <p className="text-gray-500 mb-6 text-sm">Send an invitation to join the owner team.</p>

                        <div className="space-y-4 mb-6">
                            <input type="email" placeholder="Email Address" className="w-full border rounded-lg px-3 py-2" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="First Name" className="w-full border rounded-lg px-3 py-2" />
                                <input type="text" placeholder="Last Name" className="w-full border rounded-lg px-3 py-2" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Send Invitation</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerAdmins;
