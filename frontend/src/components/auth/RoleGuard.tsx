import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleGuardProps {
    allowedRoles: ('tenant_owner' | 'admin' | 'coach' | 'client')[];
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate home based on role
        if (user.role === 'client') {
            return <Navigate to="/client/home" replace />;
        }
        if (user.role === 'admin' || user.role === 'tenant_owner' || user.role === 'coach') {
            return <Navigate to="/" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default RoleGuard;
