import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
    requiredPermissions: string[];
    requireAll?: boolean; // defaults to false (OR)
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
    requiredPermissions,
    requireAll = false,
}) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Platform owners have all permissions implies checking explicit permissions might be redundant 
    // BUT our backend returns all granular permissions for platform_owner too.
    // If user has NO permissions array (legacy token), we might deny or allow based on role (legacy fallback?)
    // For safety, deny if permissions are missing but required.
    const userPermissions = user.permissions || [];

    const hasPermission = requireAll
        ? requiredPermissions.every(p => userPermissions.includes(p))
        : requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
        // Redirect to appropriate home based on role to avoid infinite loops
        // Usage of role here is strictly for UX/Redirection, not security authorization
        switch (user.role as any) {
            case 'owner':
            case 'platform_owner': // Fallback if applicable
                return <Navigate to="/owner" replace />;
            case 'client':
                return <Navigate to="/client" replace />;
            case 'coach':
                return <Navigate to="/coach" replace />;
            case 'admin':
            case 'tenant_owner':
                return <Navigate to="/" replace />;
            default:
                return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />;
};

export default PermissionGuard;
