import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ClientLayout: React.FC = () => {
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

    const isBookingPage = location.pathname === '/client/book';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40">
                <div className="text-xl font-bold text-gray-900 tracking-tight">EMS Studio</div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                </button>
            </header>

            <main>
                <Outlet />
            </main>

            {!isBookingPage && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-50 pb-safe">
                    <NavLink to="/client/home" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Home size={24} />
                        <span className="text-[10px] font-medium">Home</span>
                    </NavLink>

                    <NavLink to="/client/schedule" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Calendar size={24} />
                        <span className="text-[10px] font-medium">Schedule</span>
                    </NavLink>

                    <NavLink to="/client/profile" className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <User size={24} />
                        <span className="text-[10px] font-medium">Profile</span>
                    </NavLink>
                </nav>
            )}
        </div>
    );
};

export default ClientLayout;
