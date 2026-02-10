import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface FeatureGuardProps {
    feature: string;
    children?: React.ReactNode;
    redirectTo?: string;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({
    feature,
    children,
    redirectTo = '/'
}) => {
    const { isEnabled } = useAuth();

    if (!isEnabled(feature)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children || <Outlet />}</>;
};

export default FeatureGuard;
