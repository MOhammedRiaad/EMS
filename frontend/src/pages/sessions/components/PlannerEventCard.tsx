import React from 'react';
import { format } from 'date-fns';
import { Tag } from 'lucide-react';
import type { Session } from '../../../services/sessions.service';

interface PlannerEventCardProps {
    session: Session;
    index: number;
    top: number;
    height: number;
    onClick: () => void;
}

// Reuse color logic for consistency
const getEventColors = (session: Session): { bg: string; border: string; text: string; lightBg: string } => {
    if (session.lead) {
        return { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-white', lightBg: 'bg-purple-50' };
    }

    const roomName = session.room?.name?.toLowerCase() || '';
    if (roomName.includes('yoga')) return { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white', lightBg: 'bg-emerald-50' };
    if (roomName.includes('hiit')) return { bg: 'bg-rose-600', border: 'border-rose-700', text: 'text-white', lightBg: 'bg-rose-50' };
    if (roomName.includes('pilates')) return { bg: 'bg-violet-600', border: 'border-violet-700', text: 'text-white', lightBg: 'bg-violet-50' };
    if (roomName.includes('spin')) return { bg: 'bg-orange-600', border: 'border-orange-700', text: 'text-white', lightBg: 'bg-orange-50' };

    // Default
    return { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white', lightBg: 'bg-blue-50' };
};

const PlannerEventCard: React.FC<PlannerEventCardProps> = ({ session, top, height, onClick }) => {
    const colors = getEventColors(session);

    const clientName = session.client
        ? `${session.client.firstName} ${session.client.lastName}`
        : session.lead
            ? `${session.lead.firstName} ${session.lead.lastName} (Lead)`
            : 'Group Session';

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        // Set drag data
        e.dataTransfer.setData('application/json', JSON.stringify(session));
        e.dataTransfer.effectAllowed = 'move';

        // Create a custom drag image if needed, or let browser handle it
        // e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    };

    return (
        <div
            draggable={true}
            onDragStart={handleDragStart}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            style={{
                top: `${top}px`,
                height: `${Math.max(height, 24)}px`, // Minimum height visual
                position: 'absolute',
                left: '4px',
                right: '4px',
                zIndex: 10,
            }}
            className={`
                rounded-md shadow-sm border-l-4 overflow-hidden cursor-move
                ${colors.bg} ${colors.border} ${colors.text}
                transition-transform hover:scale-[1.02] hover:shadow-md hover:z-20
                active:opacity-50
            `}
        >
            <div className="px-2 py-1 h-full flex flex-col justify-start pointer-events-none">
                {/* Header: Time */}
                <div className="flex items-center justify-between text-[10px] font-bold opacity-90 leading-none mb-0.5">
                    <span>{format(new Date(session.startTime), 'h:mm')}</span>
                </div>

                {/* Client Name */}
                <div className="font-semibold text-xs leading-tight truncate">
                    {clientName}
                </div>

                {/* Details (only if height permits) */}
                {height > 40 && (
                    <div className="text-[10px] opacity-80 truncate mt-auto pb-0.5 flex items-center gap-1">
                        <Tag size={10} />
                        {session.programType}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlannerEventCard;
