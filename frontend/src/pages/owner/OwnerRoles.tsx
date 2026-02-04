import React, { useEffect, useState } from 'react';
import {
    Shield,
    Plus,
    Edit2,
    Trash2,
    Lock,
    Users,
    Check,
    X,
    Search
} from 'lucide-react';
import { ownerPortalService } from '../../services/owner-portal.service';
import type { Role, Permission } from '../../services/owner-portal.service';

const OwnerRoles: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role> & { permissionKeys?: string[] } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [rolesData, permissionsData] = await Promise.all([
                ownerPortalService.getAllRoles(),
                ownerPortalService.getAllPermissions()
            ]);
            setRoles(rolesData);
            setPermissions(permissionsData);
        } catch (error) {
            console.error('Failed to load roles data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = () => {
        setEditingRole({
            name: '',
            key: '',
            description: '',
            permissionKeys: [],
            isSystemRole: false
        });
        setShowModal(true);
    };

    const handleEdit = (role: Role) => {
        setEditingRole({
            ...role,
            permissionKeys: role.permissions?.map(p => p.key) || []
        });
        setShowModal(true);
    };

    const handleDelete = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return;
        try {
            await ownerPortalService.deleteRole(roleId);
            loadData();
        } catch (error) {
            alert('Failed to delete role');
        }
    };

    const handleSave = async () => {
        if (!editingRole || !editingRole.name || !editingRole.key) return;

        try {
            if (editingRole.id) {
                await ownerPortalService.updateRole(editingRole.id, {
                    name: editingRole.name,
                    description: editingRole.description,
                    permissionKeys: editingRole.permissionKeys
                });
            } else {
                await ownerPortalService.createRole({
                    key: editingRole.key,
                    name: editingRole.name,
                    description: editingRole.description,
                    permissionKeys: editingRole.permissionKeys || []
                });
            }
            setShowModal(false);
            setEditingRole(null);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Failed to save role');
        }
    };

    const togglePermission = (key: string) => {
        if (!editingRole) return;
        const currentKeys = editingRole.permissionKeys || [];
        const newKeys = currentKeys.includes(key)
            ? currentKeys.filter(k => k !== key)
            : [...currentKeys, key];
        setEditingRole({ ...editingRole, permissionKeys: newKeys });
    };

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading roles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600" /> Roles & Permissions
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage access control and system roles</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search roles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} /> New Role
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map(role => (
                    <div key={role.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${role.isSystemRole ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {role.isSystemRole ? <Lock size={20} /> : <Users size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{role.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{role.key}</p>
                                    </div>
                                </div>
                                {role.isSystemRole && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-xs text-gray-600 dark:text-gray-300 rounded font-medium">
                                        SYSTEM
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 min-h-[40px]">{role.description}</p>

                            <div className="text-xs text-gray-500">
                                <span className="font-medium text-gray-900 dark:text-white">{role.permissions?.length || 0}</span> permissions assigned
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => handleEdit(role)}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all flex items-center gap-1"
                            >
                                <Edit2 size={16} /> {role.isSystemRole ? 'View' : 'Edit'}
                            </button>
                            {!role.isSystemRole && (
                                <button
                                    onClick={() => handleDelete(role.id)}
                                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit/Create Modal */}
            {showModal && editingRole && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full p-0 flex flex-col max-h-[90vh] my-8 shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingRole.id ? (editingRole.isSystemRole ? 'View System Role' : 'Edit Role') : 'Create New Role'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {editingRole.isSystemRole
                                        ? 'System roles are predefined and cannot be modified.'
                                        : 'Define role details and assign permissions.'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Role Details Sidebar */}
                            <div className="w-full md:w-80 p-6 border-r border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
                                        <input
                                            type="text"
                                            value={editingRole.name}
                                            onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                                            disabled={!!editingRole.isSystemRole}
                                            className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700 disabled:opacity-60"
                                            placeholder="e.g. Content Manager"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key (Unique ID)</label>
                                        <input
                                            type="text"
                                            value={editingRole.key}
                                            onChange={e => setEditingRole({ ...editingRole, key: e.target.value })}
                                            disabled={!!editingRole.id}
                                            className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700 disabled:opacity-60 font-mono text-sm"
                                            placeholder="e.g. content_manager"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                        <textarea
                                            value={editingRole.description}
                                            onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                                            disabled={!!editingRole.isSystemRole}
                                            className="w-full border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700 disabled:opacity-60"
                                            rows={3}
                                            placeholder="Describe what this role can do..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Permissions Grid */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                    <span>Permissions</span>
                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                                        {editingRole.permissionKeys?.length || 0} selected
                                    </span>
                                </h4>

                                <div className="space-y-6">
                                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                        <div key={category}>
                                            <h5 className="font-medium text-xs uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-100 dark:border-slate-700 pb-1">
                                                {category.replace('_', ' ')}
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {perms.map(perm => (
                                                    <label
                                                        key={perm.key}
                                                        className={`
                                                            flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                                                            ${editingRole.permissionKeys?.includes(perm.key)
                                                                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                                                : 'border-gray-100 dark:border-slate-700 hover:border-gray-300'}
                                                            ${editingRole.isSystemRole ? 'pointer-events-none opacity-80' : ''}
                                                        `}
                                                    >
                                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${editingRole.permissionKeys?.includes(perm.key) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                                                            {editingRole.permissionKeys?.includes(perm.key) && <Check size={12} />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={editingRole.permissionKeys?.includes(perm.key) || false}
                                                            onChange={() => togglePermission(perm.key)}
                                                            disabled={!!editingRole.isSystemRole}
                                                        />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{perm.name}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{perm.description}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                {editingRole.isSystemRole ? 'Close' : 'Cancel'}
                            </button>
                            {!editingRole.isSystemRole && (
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                                >
                                    <Check size={18} /> Save Role
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerRoles;
