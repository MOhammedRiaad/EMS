import React from 'react';
import { Building2 } from 'lucide-react';
import type { Session } from '../../../services/sessions.service';
import PlannerCoachColumn from './PlannerCoachColumn';

interface PlannerStudioSectionProps {
    studio: any;
    coaches: any[];
    rooms: any[];
    date: Date;
    sessions: Session[];
    timeOffs: any[];
    minTime: Date;
    maxTime: Date;
    onSessionClick: (session: Session) => void;
    onDrop: (session: Session, targetStudioId: string, targetCoachId: string, targetRoomId: string, offsetY: number) => void;
}

const PlannerStudioSection: React.FC<PlannerStudioSectionProps> = ({
    studio,
    coaches,
    rooms,
    date,
    sessions,
    timeOffs,
    minTime,
    maxTime,
    onSessionClick,
    onDrop
}) => {
    // Filter coaches for this studio
    const activeCoaches = coaches.filter(c => c.studioId === studio.id);

    // If no coaches, maybe show a placeholder or just render room columns directly?
    // For now, let's assume valid configuration where coaches are assigned to studios
    if (activeCoaches.length === 0) {
        return null; // Or render a "No Coaches" state
    }

    return (
        <div className="flex flex-col bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-700 flex-1">
            {/* Studio Header */}
            <div className="bg-gray-100 dark:bg-slate-800 p-3 border-b border-gray-200 dark:border-slate-700 font-bold text-gray-800 dark:text-white flex items-center gap-2 sticky top-0 z-40">
                <Building2 size={18} className="text-gray-500" />
                {studio.name}
            </div>

            {/* Coach Columns Container - gap separates each coach's room group */}
            <div className="flex w-full gap-1 bg-gray-300 dark:bg-slate-600">
                {activeCoaches.map(coach => (
                    <PlannerCoachColumn
                        key={coach.id}
                        studioId={studio.id}
                        coach={coach}
                        rooms={rooms}
                        date={date}
                        sessions={sessions}
                        timeOffs={timeOffs.filter(t => t.coachId === coach.id)}
                        minTime={minTime}
                        maxTime={maxTime}
                        onSessionClick={onSessionClick}
                        onDrop={onDrop}
                    />
                ))}
            </div>
        </div>
    );
};

export default PlannerStudioSection;
