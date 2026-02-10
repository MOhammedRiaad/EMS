import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Users, Plus, X, Eye, Edit } from 'lucide-react';
import type { Session } from '../../../services/sessions.service';

interface CalendarDetailsPanelProps {
    date: Date;
    selectedSession: Session;
    sessionsToday: Session[];
    onClose: () => void;
    onViewDetails: () => void;
    onCreateSession: () => void;
}

// Color mapping for room-based styling
const getRoomColor = (roomName?: string): { bg: string; border: string; text: string } => {
    if (!roomName) return { bg: 'bg-gray-100 dark:bg-slate-700', border: 'border-gray-300', text: 'text-gray-700 dark:text-gray-300' };

    const name = roomName.toLowerCase();
    if (name.includes('yoga')) return { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-400', text: 'text-green-700 dark:text-green-300' };
    if (name.includes('hiit') || name.includes('cardio')) return { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-400', text: 'text-red-700 dark:text-red-300' };
    if (name.includes('pilates') || name.includes('reformer')) return { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' };
    if (name.includes('spin') || name.includes('cycle')) return { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' };
    return { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' };
};

const CalendarDetailsPanel: React.FC<CalendarDetailsPanelProps> = ({
    date,
    selectedSession,
    sessionsToday,
    onClose,
    onViewDetails,
    onCreateSession,
}) => {
    const colors = selectedSession.lead
        ? { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' }
        : getRoomColor(selectedSession.room?.name);

    return (
        <aside className="w-80 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex flex-col shrink-0 overflow-hidden shadow-xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Session Details
                </h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Session Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Client/Lead Name Card */}
                <div className={`p-4 rounded-xl border-l-4 ${colors.border} ${colors.bg}`}>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                        {selectedSession.client
                            ? `${selectedSession.client.firstName} ${selectedSession.client.lastName}`
                            : selectedSession.lead
                                ? `${selectedSession.lead.firstName} ${selectedSession.lead.lastName}`
                                : 'Group Session'}
                    </h4>
                    {selectedSession.lead && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 text-xs font-semibold rounded-full">
                            Lead / Trial
                        </span>
                    )}
                    <p className={`text-sm font-medium mt-1.5 ${colors.text}`}>
                        {selectedSession.programType}
                    </p>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Calendar size={16} className="text-gray-400 shrink-0" />
                        <span>{format(new Date(selectedSession.startTime), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Clock size={16} className="text-gray-400 shrink-0" />
                        <span>{format(new Date(selectedSession.startTime), 'h:mm a')} - {format(new Date(selectedSession.endTime), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <MapPin size={16} className="text-gray-400 shrink-0" />
                        <span>{selectedSession.room?.name || 'No Room'} • {selectedSession.studio?.name || 'No Studio'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <User size={16} className="text-gray-400 shrink-0" />
                        <span>Coach: {selectedSession.coach?.user ? `${selectedSession.coach.user.firstName || ''} ${selectedSession.coach.user.lastName || ''}`.trim() : 'Unassigned'}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                        ${selectedSession.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                        ${selectedSession.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                        ${selectedSession.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}
                        ${selectedSession.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : ''}
                        ${selectedSession.status === 'no_show' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
                    `}>
                        {selectedSession.status.replace('_', ' ')}
                    </span>
                </div>

                {/* Participants (for group sessions) */}
                {selectedSession.type === 'group' && selectedSession.participants && selectedSession.participants.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users size={14} /> Participants
                            </h5>
                            <span className="text-xs text-gray-500">{selectedSession.participants.length} / {selectedSession.capacity}</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedSession.participants.map((p, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                        {p.client?.firstName?.[0] || p.lead?.firstName?.[0] || '?'}{p.client?.lastName?.[0] || p.lead?.lastName?.[0] || ''}
                                    </div>
                                    <span>{p.client ? `${p.client.firstName} ${p.client.lastName}` : p.lead ? `${p.lead.firstName} ${p.lead.lastName}` : 'Unknown'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
                <button
                    onClick={onViewDetails}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                    <Eye size={18} />
                    View Full Details
                </button>
                <button
                    onClick={onCreateSession}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    Create New Booking
                </button>
            </div>
        </aside>
    );
};

export default CalendarDetailsPanel;
