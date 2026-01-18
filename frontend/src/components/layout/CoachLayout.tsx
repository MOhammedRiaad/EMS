import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';

const CoachLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();

    React.useEffect(() => {
        if (!isAuthenticated) navigate('/login');
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isSubPage = location.pathname.includes('/coach/inbody') || (location.pathname.includes('/coach/clients/') && location.pathname.split('/').length > 4);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans pb-20 transition-colors duration-200">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40 transition-colors duration-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        C
                    </div>
                    <div className="text-lg font-bold text-gray-900 tracking-tight">Coach Portal</div>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="p-4">
                <Outlet />
            </main>

            {!isSubPage && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-6 py-3 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-200">
                    <NavLink to="/coach/home" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Home size={24} />
                        <span className="text-[10px] font-medium">Home</span>
                    </NavLink>

                    <NavLink to="/coach/availability" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Calendar size={24} />
                        <span className="text-[10px] font-medium">Availability</span>
                    </NavLink>

                    <NavLink to="/coach/clients" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Users size={24} />
                        <span className="text-[10px] font-medium">Clients</span>
                    </NavLink>
                </nav>
            )}
        </div>
    );
};

export default CoachLayout;
