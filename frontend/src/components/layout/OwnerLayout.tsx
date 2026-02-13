import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    AlertTriangle,
    Settings,
    LogOut,
    Shield,
    CreditCard,
    Zap,
    Workflow,
    Mail,
    FileCheck,
    LifeBuoy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { ownerPortalService } from '../../services/owner-portal.service';

const OwnerLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();
    const [alertCounts, setAlertCounts] = React.useState({ critical: 0, warning: 0, total: 0 });

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'owner') {
            // Redirect if not owner
            // navigate('/login'); // Commented out for now, assuming auth guard handles this
        }

        // Fetch alert counts
        const fetchAlerts = async () => {
            try {
                const counts = await ownerPortalService.getAlertCounts();
                setAlertCounts(counts);
            } catch (e) {
                console.error('Failed to fetch alert counts', e);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
        return () => clearInterval(interval);

    }, [isAuthenticated, user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const navItems = [
        { path: '/owner', label: 'Overview', icon: LayoutDashboard },
        { path: '/owner/tenants', label: 'Tenants', icon: Users },
        { path: '/owner/analytics', label: 'Analytics', icon: TrendingUp },
        { path: '/owner/automations', label: 'Global Automations', icon: Workflow },
        { path: '/owner/messaging', label: 'Global Messaging', icon: Mail },
        { path: '/owner/alerts', label: 'Alerts', icon: AlertTriangle, badge: alertCounts.total > 0 ? alertCounts.total : undefined, badgeColor: alertCounts.critical > 0 ? 'bg-red-500' : 'bg-yellow-500' },
        { path: '/owner/compliance', label: 'Compliance', icon: FileCheck },
        { path: '/owner/upgrades', label: 'Upgrade Requests', icon: TrendingUp },
        { path: '/owner/features', label: 'Feature Flags', icon: Zap },
        { path: '/owner/plans', label: 'Plans & Billing', icon: CreditCard },
        { path: '/owner/admins', label: 'Admin Team', icon: Users }, // Reusing Users or importing UserCog
        { path: '/owner/roles', label: 'Roles & Permissions', icon: Shield },
        { path: '/owner/support', label: 'Platform Support', icon: LifeBuoy },
        { path: '/owner/settings', label: 'System Settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300">
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">EMS Admin</h1>
                        <p className="text-xs text-slate-400">System Owner Portal</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/owner' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className={`
                                        text-xs font-bold px-2 py-0.5 rounded-full text-white
                                        ${item.badgeColor || 'bg-blue-500'}
                                    `}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-slate-800/50">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                            {user?.firstName?.[0] || 'O'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {navItems.find(i => user?.role === 'owner' && (i.path === location.pathname || (i.path !== '/owner' && location.pathname.startsWith(i.path))))?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default OwnerLayout;
