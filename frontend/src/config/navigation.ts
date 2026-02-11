import {
    LayoutDashboard,
    Users,
    Dumbbell,
    Calendar,
    Settings,
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
    Target,
    Megaphone,
    Home,
    Trophy,
    Upload,
    NotebookTabs,
} from 'lucide-react';

export type NavSection = 'core' | 'management' | 'client-business' | 'retail' | 'marketing' | 'analytics' | 'administration' | 'client-portal' | 'coach-portal';

export interface NavItem {
    id: string;
    path: string;
    label: string;
    icon: any;
    section: NavSection;
    requiredFeature?: string;
    requiredPermission?: string; // e.g., 'client.read'
    requiredRole?: string[]; // e.g., ['tenant_owner', 'admin']
    requiredSetting?: string; // Check against tenant.settings
    adminOnly?: boolean; // Short hand for tenant_owner/admin role check
}

export const NAVIGATION_ITEMS: NavItem[] = [
    // Core
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'core' },
    { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar, section: 'core', requiredFeature: 'core.sessions' },
    { id: 'sessions', path: '/sessions', label: 'Sessions', icon: NotebookTabs, section: 'core', requiredFeature: 'core.sessions' },
    { id: 'clients', path: '/clients', label: 'Clients', icon: Users, section: 'core', requiredFeature: 'core.sessions' }, // Linked to sessions for now

    // Management
    { id: 'coaches', path: '/coaches', label: 'Coaches', icon: Users, section: 'management', requiredFeature: 'core.coaches' },
    { id: 'studios', path: '/studios', label: 'Studios', icon: Building2, section: 'management', requiredFeature: 'core.multi_studio' },
    { id: 'rooms', path: '/rooms', label: 'Rooms', icon: DoorOpen, section: 'management', requiredFeature: 'core.rooms' },
    { id: 'devices', path: '/devices', label: 'Devices', icon: Dumbbell, section: 'management', requiredFeature: 'core.devices' },
    { id: 'inbody', path: '/inbody', label: 'InBody Scans', icon: Activity, section: 'management', requiredFeature: 'client.inbody_scans' },
    { id: 'time-off', path: '/admin/time-off', label: 'Time Off Requests', icon: Calendar, section: 'management', requiredFeature: 'coach.portal' },

    // Client & Business
    { id: 'waiting-list', path: '/admin/waiting-list', label: 'Waiting List', icon: ListPlus, section: 'client-business', requiredFeature: 'core.waiting_list' },
    { id: 'packages', path: '/admin/packages', label: 'Packages', icon: Package, section: 'client-business', requiredFeature: 'core.packages' },

    // Retail
    { id: 'pos', path: '/retail/pos', label: 'Point of Sale', icon: CreditCard, section: 'retail', requiredFeature: 'finance.pos' },
    { id: 'products', path: '/retail/products', label: 'Products', icon: Tags, section: 'retail', requiredFeature: 'finance.pos' },
    { id: 'inventory', path: '/retail/inventory', label: 'Inventory', icon: ShoppingBag, section: 'retail', requiredFeature: 'finance.pos' },
    { id: 'reports', path: '/retail/reports', label: 'Reports', icon: FileText, section: 'retail', requiredFeature: 'finance.reports' },

    // Marketing
    { id: 'marketing', path: '/admin/marketing', label: 'Marketing & Leads', icon: Target, section: 'marketing', requiredFeature: 'marketing.leads_crm', adminOnly: true },

    // Analytics
    { id: 'analytics', path: '/analytics', label: 'Analytics', icon: TrendingUp, section: 'analytics', requiredFeature: 'core.analytics', adminOnly: true },
    { id: 'coach-performance', path: '/admin/coach-performance', label: 'Coach Performance', icon: TrendingUp, section: 'analytics', requiredFeature: 'core.analytics', adminOnly: true },
    { id: 'cash-flow', path: '/admin/cash-flow', label: 'Cash Flow', icon: Wallet, section: 'analytics', requiredFeature: 'finance.reports', adminOnly: true },

    // Administration
    { id: 'users', path: '/admin/users', label: 'User Management', icon: UserCog, section: 'administration', adminOnly: true, requiredFeature: 'dashboard.admin' },
    { id: 'settings', path: '/admin/settings', label: 'Settings', icon: Settings, section: 'administration', adminOnly: true, requiredFeature: 'dashboard.admin' },
    { id: 'branding', path: '/admin/branding', label: 'Branding', icon: Palette, section: 'administration', adminOnly: true, requiredFeature: 'core.branding' },
    { id: 'announcements', path: '/admin/announcements', label: 'Announcements', icon: Megaphone, section: 'administration', adminOnly: true, requiredFeature: 'communication.announcements' },
    { id: 'audit-logs', path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText, section: 'administration', adminOnly: true, requiredFeature: 'compliance.audit_logs' },
    { id: 'data-import', path: '/admin/import', label: 'Data Import', icon: Upload, section: 'administration', adminOnly: true, requiredFeature: 'core.data_import' },

    // Client Portal
    { id: 'client-home', path: '/client/home', label: 'Home', icon: Home, section: 'client-portal', requiredRole: ['client'] },
    { id: 'client-schedule', path: '/client/schedule', label: 'Schedule', icon: Calendar, section: 'client-portal', requiredRole: ['client'], requiredFeature: 'core.sessions' },
    { id: 'client-leaderboard', path: '/client/leaderboard', label: 'Leaderboard', icon: Trophy, section: 'client-portal', requiredRole: ['client'], requiredFeature: 'client.leaderboard' },
    { id: 'client-profile', path: '/client/profile', label: 'Profile', icon: Users, section: 'client-portal', requiredRole: ['client'] },

    // Coach Portal
    { id: 'coach-home', path: '/coach/home', label: 'Home', icon: Home, section: 'coach-portal', requiredRole: ['coach'] },
    { id: 'coach-availability', path: '/coach/availability', label: 'Availability', icon: Calendar, section: 'coach-portal', requiredRole: ['coach'], requiredSetting: 'allowCoachSelfEditAvailability' },
    { id: 'coach-clients', path: '/coach/clients', label: 'Clients', icon: Users, section: 'coach-portal', requiredRole: ['coach'] },
    { id: 'coach-settings', path: '/coach/settings', label: 'Settings', icon: Settings, section: 'coach-portal', requiredRole: ['coach'] },
];
