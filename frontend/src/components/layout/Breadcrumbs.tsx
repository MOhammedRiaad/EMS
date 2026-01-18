import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Breadcrumbs.css';

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();

    const pathSegments = location.pathname
        .split('/')
        .filter(segment => segment !== '');

    if (pathSegments.length === 0) {
        return null; // Don't show breadcrumbs on home
    }

    const breadcrumbs = pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const label = segment
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return { path, label };
    });

    return (
        <nav className="breadcrumbs">
            <Link to="/" className="breadcrumb-item">
                <Home size={14} />
            </Link>
            {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                    <ChevronRight size={14} className="breadcrumb-separator" />
                    {index === breadcrumbs.length - 1 ? (
                        <span className="breadcrumb-item active">{crumb.label}</span>
                    ) : (
                        <Link to={crumb.path} className="breadcrumb-item">
                            {crumb.label}
                        </Link>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};
