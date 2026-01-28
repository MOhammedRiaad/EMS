import React, { useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Dumbbell,
    Calendar,
    Settings,
    LogOut,
    Building2,
    DoorOpen,
    UserCog,
    TrendingUp,
    Activity,
    ListPlus,
    Package,
    Wallet,
    ShoppingBag,
    Tags,
    CreditCard,
    FileText,
    Palette,
    Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuPreferences } from '../../contexts/MenuPreferencesContext';
import { ThemeToggle } from '../common/ThemeToggle';
import MenuSection, { type MenuItem } from './MenuSection';
import { MenuSearch } from './MenuSearch';
import { Breadcrumbs } from './Breadcrumbs';
import './Layout.css';

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const { user, tenant, logout, isAuthenticated } = useAuth();
    const { isPinned } = useMenuPreferences();

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

    // Check if user can see admin menu
    const canSeeAdminMenu = user?.role === 'tenant_owner' || user?.role === 'admin';

    // Define all menu items
    const coreItems: MenuItem[] = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/sessions', label: 'Sessions', icon: Calendar },
        { path: '/clients', label: 'Clients', icon: Users },
    ];

    const managementItems: MenuItem[] = [
        { path: '/coaches', label: 'Coaches', icon: Users },
        { path: '/studios', label: 'Studios', icon: Building2 },
        { path: '/rooms', label: 'Rooms', icon: DoorOpen },
        { path: '/devices', label: 'Devices', icon: Dumbbell },
        { path: '/inbody', label: 'InBody Scans', icon: Activity },
    ];

    const clientBusinessItems: MenuItem[] = [
        { path: '/admin/waiting-list', label: 'Waiting List', icon: ListPlus },
        { path: '/admin/packages', label: 'Packages', icon: Package },
    ];

    const analyticsItems: MenuItem[] = [
        { path: '/analytics', label: 'Analytics', icon: TrendingUp },
        { path: '/admin/coach-performance', label: 'Coach Performance', icon: TrendingUp },
        { path: '/admin/cash-flow', label: 'Cash Flow', icon: Wallet },
    ];

    const administrationItems: MenuItem[] = [
        { path: '/admin/users', label: 'User Management', icon: UserCog },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
        { path: '/admin/branding', label: 'Branding', icon: Palette },
    ];

    const retailItems: MenuItem[] = [
        { path: '/retail/pos', label: 'Point of Sale', icon: CreditCard },
        { path: '/retail/products', label: 'Products', icon: Tags },
        { path: '/retail/inventory', label: 'Inventory', icon: ShoppingBag },
        { path: '/retail/reports', label: 'Reports', icon: FileText },
    ];

    const marketingItems: MenuItem[] = [
        { path: '/admin/marketing', label: 'Marketing & Leads', icon: Target },
    ];

    // Combine all items for search
    const allItems = useMemo(() => {
        const items = [...coreItems, ...managementItems, ...clientBusinessItems, ...retailItems];
        if (canSeeAdminMenu) {
            items.push(...marketingItems, ...analyticsItems, ...administrationItems);
        }
        return items;
    }, [canSeeAdminMenu]);

    // Get pinned items
    const pinnedItems = useMemo(() => {
        return allItems.filter(item => isPinned(item.path));
    }, [allItems, isPinned]);

    return (
        <div className="container">
            <aside className="sidebar">
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
                <MenuSearch allItems={allItems} onNavigate={navigate} />

                <nav className="nav">
                    {/* Pinned Items */}
                    {pinnedItems.length > 0 && (
                        <MenuSection
                            id="pinned"
                            title="Pinned"
                            collapsible={false}
                            items={pinnedItems}
                        />
                    )}

                    {/* Core Operations */}
                    <MenuSection
                        id="core"
                        title="Core"
                        collapsible={false}
                        items={coreItems}
                    />

                    {/* Management */}
                    <MenuSection
                        id="management"
                        title="Management"
                        items={managementItems}
                    />

                    {/* Client & Business */}
                    <MenuSection
                        id="client-business"
                        title="Client & Business"
                        items={clientBusinessItems}
                    />

                    {/* Retail */}
                    <MenuSection
                        id="retail"
                        title="Retail"
                        items={retailItems}
                    />

                    {/* Marketing (Admin/Owner only) */}
                    {canSeeAdminMenu && (
                        <MenuSection
                            id="marketing"
                            title="Marketing"
                            items={marketingItems}
                        />
                    )}

                    {/* Analytics (Admin/Owner only) */}
                    {canSeeAdminMenu && (
                        <MenuSection
                            id="analytics"
                            title="Analytics"
                            items={analyticsItems}
                        />
                    )}

                    {/* Administration (Admin/Owner only) */}
                    {canSeeAdminMenu && (
                        <MenuSection
                            id="administration"
                            title="Administration"
                            items={administrationItems}
                        />
                    )}
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div
                        className="nav-item"
                        style={{ color: 'var(--color-danger)', cursor: 'pointer' }}
                        onClick={handleLogout}
                    >
                        <LogOut className="nav-icon" />
                        <span>Logout</span>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="header">
                    <div>
                        <Breadcrumbs />
                    </div>

                    <div className="user-profile">
                        <div className="avatar">{getInitials()}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{getDisplayName()}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                                {user?.role?.replace('_', ' ') || ''}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
