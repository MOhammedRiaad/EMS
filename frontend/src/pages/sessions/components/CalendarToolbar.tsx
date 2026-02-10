import React from 'react';
import { Views } from 'react-big-calendar';
import { Calendar as CalendarIcon, List, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarToolbarProps {
    date: Date;
    view: string;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
    onView: (view: any) => void;
    onNewSession: () => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
    date, view, onView, onNewSession
}) => {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {/* Date Display */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {format(date, 'EEEE, MMMM d, yyyy')}
            </h2>

            {/* View Switcher */}
            <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 dark:bg-slate-700/50 rounded-lg p-1">
                    {[
                        { label: 'Week', value: Views.WEEK, icon: CalendarIcon },
                        { label: 'Day', value: Views.DAY, icon: Clock },
                        { label: 'Agenda', value: Views.AGENDA, icon: List },
                    ].map((item) => {
                        const isActive = view === item.value;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.value}
                                onClick={() => onView(item.value)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }
                                `}
                            >
                                <Icon size={14} />
                                <span className="hidden sm:inline">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* New Session Button (compact) */}
                <button
                    onClick={onNewSession}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">New</span>
                </button>
            </div>
        </div>
    );
};

export default CalendarToolbar;
