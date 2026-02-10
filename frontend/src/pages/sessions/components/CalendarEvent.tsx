import React from 'react';
import type { Session } from '../../../services/sessions.service';
import { format } from 'date-fns';

interface CalendarEventProps {
    event: {
        title: string;
        start: Date;
        end: Date;
        resourceId?: string;
        data: Session;
    };
    title: string;
}

// Color palette for events
const getEventColors = (session: Session): { bg: string; accent: string; text: string } => {
    // Lead sessions get purple
    if (session.lead) {
        return { bg: 'bg-purple-500', accent: 'bg-purple-600', text: 'text-white' };
    }

    // Color by room name or default
    const roomName = session.room?.name?.toLowerCase() || '';

    if (roomName.includes('yoga')) return { bg: 'bg-emerald-500', accent: 'bg-emerald-600', text: 'text-white' };
    if (roomName.includes('hiit') || roomName.includes('cardio')) return { bg: 'bg-rose-500', accent: 'bg-rose-600', text: 'text-white' };
    if (roomName.includes('pilates') || roomName.includes('reformer')) return { bg: 'bg-violet-500', accent: 'bg-violet-600', text: 'text-white' };
    if (roomName.includes('spin') || roomName.includes('cycle')) return { bg: 'bg-orange-500', accent: 'bg-orange-600', text: 'text-white' };
    if (roomName.includes('ems') || roomName.includes('training')) return { bg: 'bg-blue-500', accent: 'bg-blue-600', text: 'text-white' };

    // Default: pink/magenta (like in the reference image)
    return { bg: 'bg-pink-500', accent: 'bg-pink-600', text: 'text-white' };
};

const CalendarEvent: React.FC<CalendarEventProps> = ({ event }) => {
    const session = event.data;
    const colors = getEventColors(session);

    const clientName = session.client
        ? `${session.client.firstName} ${session.client.lastName}`
        : session.lead
            ? `${session.lead.firstName} ${session.lead.lastName}`
            : 'Group Session';

    const coachInitials = session.coach?.user?.firstName
        ? `${session.coach.user.firstName[0]}${session.coach.user.lastName?.[0] || ''}`
        : null;

    return (
        <div
            className={`h-full w-full rounded-md overflow-hidden flex flex-col ${colors.bg} ${colors.text} shadow-sm hover:shadow-md transition-all cursor-pointer`}
        >
            {/* Top bar with coach avatar */}
            <div className="flex items-center justify-between px-2 pt-1.5">
                <span className="text-[10px] font-bold opacity-90">
                    {format(event.start, 'h:mm')}
                </span>
                {coachInitials && (
                    <div
                        className={`w-5 h-5 rounded-full ${colors.accent} text-[9px] font-bold flex items-center justify-center shadow-sm`}
                        title={`Coach: ${session.coach?.user?.firstName || ''} ${session.coach?.user?.lastName || ''}`.trim()}
                    >
                        {coachInitials}
                    </div>
                )}
            </div>

            {/* Client/Lead Name */}
            <div className="px-2 text-xs font-semibold truncate leading-tight">
                {clientName}
            </div>

            {/* Room / Program Type */}
            <div className="px-2 mt-auto pb-1 text-[9px] opacity-80 truncate">
                {session.room?.name || session.programType}
            </div>
        </div>
    );
};

export default CalendarEvent;
