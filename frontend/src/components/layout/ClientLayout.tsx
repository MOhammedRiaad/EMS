import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, User, LogOut, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import ComplianceManager from '../compliance/ComplianceManager';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { AnnouncementModal } from '../notifications/AnnouncementModal';

const ClientLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, isAuthenticated, tenant } = useAuth();

    // Compliance handled by ComplianceManager

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isBookingPage = location.pathname === '/client/book';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans pb-20 transition-colors duration-200">
            <ComplianceManager />

            {/* Header */}
            <header className="bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40 transition-colors duration-200">
                <div className="flex items-center gap-2">
                    {tenant?.settings?.branding?.logoUrl ? (
                        <img
                            src={tenant.settings.branding.logoUrl}
                            alt={tenant.name}
                            className="h-8 w-auto object-contain"
                        />
                    ) : (
                        <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {tenant?.name || 'EMS Studio'}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <NotificationCenter />
                    <ThemeToggle />
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <AnnouncementModal />

            <main>
                <Outlet />
            </main>

            {!isBookingPage && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-6 py-3 flex justify-around items-center z-50 pb-safe transition-colors duration-200">
                    <NavLink to="/client/home" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                        <Home size={24} />
                        <span className="text-[10px] font-medium">Home</span>
                    </NavLink>

                    <NavLink to="/client/schedule" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                        <Calendar size={24} />
                        <span className="text-[10px] font-medium">Schedule</span>
                    </NavLink>

                    <NavLink to="/client/leaderboard" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                        <Trophy size={24} />
                        <span className="text-[10px] font-medium">Leaderboard</span>
                    </NavLink>

                    <NavLink to="/client/profile" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                        <User size={24} />
                        <span className="text-[10px] font-medium">Profile</span>
                    </NavLink>
                </nav>
            )}
        </div>
    );
};

export default ClientLayout;
