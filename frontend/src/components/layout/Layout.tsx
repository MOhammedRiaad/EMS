import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
    Wallet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import './Layout.css';

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, tenant, logout, isAuthenticated } = useAuth();

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

    // Get page title from route
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        const segment = path.split('/')[1];
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    // Check if user can see admin menu
    const canSeeAdminMenu = user?.role === 'tenant_owner' || user?.role === 'admin';

    return (
        <div className="container">
            <aside className="sidebar">
                <div className="logo-area">
                    <span className="logo-text">{tenant?.name || 'EMS Studio'}</span>
                </div>

                <nav className="nav">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard className="nav-icon" />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/sessions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Calendar className="nav-icon" />
                        <span>Sessions</span>
                    </NavLink>

                    <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users className="nav-icon" />
                        <span>Clients</span>
                    </NavLink>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />

                    <NavLink to="/coaches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users className="nav-icon" />
                        <span>Coaches</span>
                    </NavLink>

                    <NavLink to="/studios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Building2 className="nav-icon" />
                        <span>Studios</span>
                    </NavLink>

                    <NavLink to="/rooms" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <DoorOpen className="nav-icon" />
                        <span>Rooms</span>
                    </NavLink>

                    <NavLink to="/devices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Dumbbell className="nav-icon" />
                        <span>Devices</span>
                    </NavLink>

                    <NavLink to="/inbody" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Activity className="nav-icon" />
                        <span>InBody Scans</span>
                    </NavLink>

                    {canSeeAdminMenu && (
                        <>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />
                            <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <UserCog className="nav-icon" />
                                <span>User Management</span>
                            </NavLink>
                            <NavLink to="/admin/coach-performance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <TrendingUp className="nav-icon" />
                                <span>Coach Performance</span>
                            </NavLink>
                            <NavLink to="/admin/waiting-list" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <ListPlus className="nav-icon" />
                                <span>Waiting List</span>
                            </NavLink>
                            <NavLink to="/admin/packages" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Package className="nav-icon" />
                                <span>Packages</span>
                            </NavLink>
                            <NavLink to="/admin/cash-flow" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Wallet className="nav-icon" />
                                <span>Cash Flow</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div className="nav-item">
                        <Settings className="nav-icon" />
                        <span>Settings</span>
                    </div>
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
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{getPageTitle()}</h2>

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
