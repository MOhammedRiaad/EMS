import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Zap, LayoutList, List, BarChart, Megaphone, Clock } from 'lucide-react';

const MarketingDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing & Leads</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your sales pipeline and automated campaigns</p>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                <NavLink
                    to="/admin/marketing/leads"
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                            ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`
                    }
                    end
                >
                    <LayoutList size={18} />
                    Kanban Board
                </NavLink>
                <NavLink
                    to="/admin/marketing/leads/list"
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                            ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`
                    }
                >
                    <List size={18} />
                    List View
                </NavLink>
                <NavLink
                    to="/admin/marketing/automations"
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                            ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`
                    }
                >
                    <Zap size={18} />
                    Automations
                </NavLink>
                <NavLink
                    to="/admin/marketing/queue"
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                            ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`
                    }
                >
                    <Clock size={18} />
                    Queue
                </NavLink>
                <NavLink
                    to="/admin/marketing/announcements"
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                            ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`
                    }
                >
                    <Megaphone size={18} />
                    Announcements
                </NavLink>
                <NavLink
                    to="/admin/marketing/reports"
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                            ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`
                    }
                >
                    <BarChart size={18} />
                    Reports
                </NavLink>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                <Outlet />
            </div>
        </div>
    );
};

export default MarketingDashboard;
