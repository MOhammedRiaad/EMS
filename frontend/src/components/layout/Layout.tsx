import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    AppWindow,
    LayoutDashboard,
    Users,
    Dumbbell,
    Calendar,
    Settings,
    LogOut,
    Building2,
    DoorOpen
} from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
    return (
        <div className="container">
            <aside className="sidebar">
                <div className="logo-area">
                    <span className="logo-text">EMS Studio</span>
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
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div className="nav-item">
                        <Settings className="nav-icon" />
                        <span>Settings</span>
                    </div>
                    <div className="nav-item" style={{ color: 'var(--color-danger)' }}>
                        <LogOut className="nav-icon" />
                        <span>Logout</span>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="header">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Dashboard</h2>

                    <div className="user-profile">
                        <div className="avatar">DA</div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Demo Admin</span>
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
