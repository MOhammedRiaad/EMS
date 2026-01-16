import { useAuth } from '../contexts/AuthContext';

type Role = 'tenant_owner' | 'admin' | 'coach' | 'staff' | 'client';

export function usePermissions() {
    const { user } = useAuth();

    const userRole = user?.role as Role | undefined;

    const canEdit = userRole === 'tenant_owner' || userRole === 'admin';
    const canDelete = userRole === 'tenant_owner' || userRole === 'admin';
    const canCreate = userRole === 'tenant_owner' || userRole === 'admin';
    const isAdmin = userRole === 'tenant_owner' || userRole === 'admin';
    const isOwner = userRole === 'tenant_owner';

    const hasRole = (...roles: Role[]) => userRole ? roles.includes(userRole) : false;

    return {
        canEdit,
        canDelete,
        canCreate,
        isAdmin,
        isOwner,
        hasRole,
        userRole
    };
}
