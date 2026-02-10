import React, { useState, useMemo } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Building2, MapPin, Users } from 'lucide-react';

interface Studio {
    id: string;
    name: string;
}

interface Room {
    id: string;
    name: string;
    studioId: string;
}

interface Coach {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}

interface CalendarSidebarProps {
    date: Date;
    onNavigate: (date: Date) => void;
    // Filters
    studios: Studio[];
    rooms: Room[];
    coaches: Coach[];
    selectedStudioIds: string[];
    selectedRoomIds: string[];
    selectedCoachIds: string[];
    onStudioToggle: (id: string) => void;
    onRoomToggle: (id: string) => void;
    onCoachToggle: (id: string) => void;
    // View type
    resourceType: 'coach' | 'room' | 'studio';
    setResourceType: (type: 'coach' | 'room' | 'studio') => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
    date,
    onNavigate,
    studios,
    rooms,
    coaches,
    selectedStudioIds,
    selectedRoomIds,
    selectedCoachIds,
    onStudioToggle,
    onRoomToggle,
    onCoachToggle,
    resourceType,
    setResourceType,
}) => {
    const [isStudioOpen, setIsStudioOpen] = useState(true);
    const [isRoomOpen, setIsRoomOpen] = useState(true);
    const [isCoachOpen, setIsCoachOpen] = useState(true);

    // Get week days for the mini calendar strip
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [weekStart]);

    const isToday = (d: Date) => format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const isSelected = (d: Date) => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

    return (
        <aside className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-6 overflow-y-auto shrink-0">
            {/* Date Navigation */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => onNavigate(subDays(date, 7))}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {format(weekStart, 'MMM d')} - {format(endOfWeek(date, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                    </span>
                    <button
                        onClick={() => onNavigate(addDays(date, 7))}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
                {/* Mini Week Strip */}
                <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => (
                        <button
                            key={day.toISOString()}
                            onClick={() => onNavigate(day)}
                            className={`flex flex-col items-center p-1.5 rounded-lg text-xs transition-all
                                ${isSelected(day)
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : isToday(day)
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-600'
                                        : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            <span className="font-medium">{format(day, 'EEE')}</span>
                            <span className={`text-base font-bold ${isSelected(day) ? '' : ''}`}>{format(day, 'd')}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onNavigate(new Date())}
                    className="w-full mt-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                    Today
                </button>
            </div>

            {/* Resource Type Selector */}
            <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">View By</p>
                <div className="flex bg-gray-100 dark:bg-slate-700/50 rounded-lg p-1 gap-1">
                    {[
                        { type: 'studio' as const, icon: Building2, label: 'Studio' },
                        { type: 'room' as const, icon: MapPin, label: 'Room' },
                        { type: 'coach' as const, icon: Users, label: 'Coach' },
                    ].map(item => (
                        <button
                            key={item.type}
                            onClick={() => setResourceType(item.type)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all
                                ${resourceType === item.type
                                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <item.icon size={14} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Studios Filter */}
            <div>
                <button
                    onClick={() => setIsStudioOpen(!isStudioOpen)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                >
                    Studios
                    <ChevronRight size={14} className={`transform transition-transform ${isStudioOpen ? 'rotate-90' : ''}`} />
                </button>
                {isStudioOpen && (
                    <div className="flex flex-wrap gap-1.5">
                        {studios.map(studio => (
                            <button
                                key={studio.id}
                                onClick={() => onStudioToggle(studio.id)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                                    ${selectedStudioIds.includes(studio.id)
                                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500'
                                    }`}
                            >
                                {studio.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Rooms Filter */}
            <div>
                <button
                    onClick={() => setIsRoomOpen(!isRoomOpen)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                >
                    Rooms
                    <ChevronRight size={14} className={`transform transition-transform ${isRoomOpen ? 'rotate-90' : ''}`} />
                </button>
                {isRoomOpen && (
                    <div className="flex flex-wrap gap-1.5">
                        {rooms.map(room => (
                            <button
                                key={room.id}
                                onClick={() => onRoomToggle(room.id)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                                    ${selectedRoomIds.includes(room.id)
                                        ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-slate-500'
                                    }`}
                            >
                                {room.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Coaches Filter */}
            <div>
                <button
                    onClick={() => setIsCoachOpen(!isCoachOpen)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                >
                    Coaches
                    <ChevronRight size={14} className={`transform transition-transform ${isCoachOpen ? 'rotate-90' : ''}`} />
                </button>
                {isCoachOpen && (
                    <div className="flex flex-wrap gap-2">
                        {coaches.map(coach => (
                            <button
                                key={coach.id}
                                onClick={() => onCoachToggle(coach.id)}
                                title={`${coach.firstName} ${coach.lastName}`}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2
                                    ${selectedCoachIds.includes(coach.id)
                                        ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700'
                                        : 'border-transparent hover:border-gray-300 dark:hover:border-slate-500'
                                    }
                                    ${coach.avatarUrl ? '' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'}
                                `}
                            >
                                {coach.avatarUrl ? (
                                    <img src={coach.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span>{coach.firstName[0]}{coach.lastName[0]}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default CalendarSidebar;
