import React from 'react';
import { getAvatarDisplay } from '../../../utils/imageUtils';
import type { Session } from '../../../services/sessions.service';
import PlannerRoomSubColumn from './PlannerRoomSubColumn';

interface PlannerCoachColumnProps {
    studioId: string;
    coach: any;
    rooms: any[];
    date: Date;
    sessions: Session[];
    timeOffs: any[];
    minTime: Date;
    maxTime: Date;
    onSessionClick: (session: Session) => void;
    onDrop: (session: Session, targetStudioId: string, targetCoachId: string, targetRoomId: string, offsetY: number) => void;
}

const PlannerCoachColumn: React.FC<PlannerCoachColumnProps> = ({
    studioId,
    coach,
    rooms,
    date,
    sessions,
    timeOffs,
    minTime,
    maxTime,
    onSessionClick,
    onDrop
}) => {
    // Each coach gets ALL active rooms for this studio as sub-columns
    // This allows scheduling the same coach in different rooms at different times
    const activeRooms = rooms.filter(r => r.studioId === studioId && r.active !== false);

    // Avatar logic
    const { imageUrl, initials } = getAvatarDisplay(coach);

    return (
        <div className="flex flex-col flex-1">
            {/* Coach Header - spans above all this coach's rooms */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 border-b-2 border-blue-200 dark:border-blue-800 p-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={`${coach.firstName} ${coach.lastName}`} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm">{initials}</span>
                    )}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                    {coach.firstName} {coach.lastName}
                </h3>
            </div>

            {/* Room Sub-Columns - each room is a column under THIS coach */}
            <div className="flex flex-1">
                {activeRooms.map(room => (
                    <PlannerRoomSubColumn
                        key={room.id}
                        studioId={studioId}
                        coachId={coach.id}
                        roomId={room.id}
                        roomName={room.name}
                        date={date}
                        sessions={sessions.filter(s => s.roomId === room.id && s.coachId === coach.id)}
                        timeOffs={timeOffs}
                        minTime={minTime}
                        maxTime={maxTime}
                        onSessionClick={onSessionClick}
                        onDrop={onDrop}
                    />
                ))}
                {activeRooms.length === 0 && (
                    <div className="flex-1 min-w-[200px] flex items-center justify-center text-gray-400 text-sm bg-gray-50 dark:bg-slate-900/50 p-8">
                        No Rooms Configured
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlannerCoachColumn;
