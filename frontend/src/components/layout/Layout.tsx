import React, { useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    LogOut,
    ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuPreferences } from '../../contexts/MenuPreferencesContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { ThemeToggle } from '../common/ThemeToggle';
import MenuSection from './MenuSection';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { AnnouncementModal } from '../notifications/AnnouncementModal';
import { MenuSearch } from './MenuSearch';
import { Breadcrumbs } from './Breadcrumbs';
import './Layout.css';

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const { user, tenant, logout, isAuthenticated } = useAuth();
    const { isPinned } = useMenuPreferences();
    const { items: allItems, sections: navSections } = useNavigation();
    const [isCollapsed, setIsCollapsed] = React.useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('sidebar_collapsed', String(newState));
            return newState;
        });
    };

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get initials from user name
    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return '?';
    };

    // Get display name
    const getDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user?.email || 'User';
    };

    // Get pinned items
    const pinnedItems = useMemo(() => {
        return allItems.filter(item => isPinned(item.path));
    }, [allItems, isPinned]);

    return (
        <div className="container">
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="logo-area">
                    {tenant?.settings?.branding?.logoUrl ? (
                        <img
                            src={tenant.settings.branding.logoUrl}
                            alt={tenant.name || 'Logo'}
                            style={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <span className="logo-text">{tenant?.name || 'EMS Studio'}</span>
                    )}
                </div>

                {/* Menu Search */}
                <MenuSearch allItems={allItems} onNavigate={navigate} isCollapsed={isCollapsed} />

                <nav className="nav">
                    {/* Pinned Items */}
                    {pinnedItems.length > 0 && (
                        <MenuSection
                            id="pinned"
                            title="Pinned"
                            collapsible={false}
                            items={pinnedItems}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {/* Core Operations */}
                    {navSections.core?.length > 0 && (
                        <MenuSection
                            id="core"
                            title="Core"
                            collapsible={false}
                            items={navSections.core}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {/* Management */}
                    {navSections.management?.length > 0 && (
                        <MenuSection
                            id="management"
                            title="Management"
                            items={navSections.management}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {/* Client & Business */}
                    {navSections['client-business']?.length > 0 && (
                        <MenuSection
                            id="client-business"
                            title="Client & Business"
                            items={navSections['client-business']}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {/* Retail */}
                    {navSections.retail?.length > 0 && (
                        <MenuSection
                            id="retail"
                            title="Retail"
                            items={navSections.retail}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {/* Marketing */}
                    {navSections.marketing?.length > 0 && (
                        <MenuSection
                            id="marketing"
                            title="Marketing"
                            items={navSections.marketing}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {/* Analytics */}
                    {navSections.analytics?.length > 0 && (
                        <MenuSection
                            id="analytics"
                            title="Analytics"
                            items={navSections.analytics}
                            isCollapsed={isCollapsed}
                        />
                    )}

                    {/* Administration */}
                    {navSections.administration?.length > 0 && (
                        <MenuSection
                            id="administration"
                            title="Administration"
                            items={navSections.administration}
                            isCollapsed={isCollapsed}
                        />
                    )}
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div
                        className="nav-item"
                        style={{ color: 'var(--color-danger)', cursor: 'pointer' }}
                        onClick={handleLogout}
                        title={isCollapsed ? 'Logout' : undefined}
                    >
                        <LogOut className="nav-icon" />
                        {!isCollapsed && <span>Logout</span>}
                    </div>
                </div>

                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    <ChevronLeft size={16} />
                </button>
            </aside>

            <main className="main-content">
                <header className="header">
                    <div>
                        <Breadcrumbs />
                    </div>



                    <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <NotificationCenter />
                        <ThemeToggle />
                        <div className="user-profile">
                            <div className="avatar">{getInitials()}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{getDisplayName()}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                                    {user?.role?.replace('_', ' ') || ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
            <AnnouncementModal />
        </div>
    );
};

export default Layout;
