import React, { useState, useRef, useCallback } from 'react';
import { differenceInMinutes, addMinutes, areIntervalsOverlapping, set, format } from 'date-fns';
import type { Session } from '../../../services/sessions.service';
import PlannerEventCard from './PlannerEventCard';

interface PlannerRoomSubColumnProps {
    studioId: string;
    coachId: string;
    roomId: string;
    roomName: string;
    date: Date;
    sessions: Session[];
    timeOffs: any[];
    minTime: Date;
    maxTime: Date;
    onSessionClick: (session: Session) => void;
    onDrop: (session: Session, targetStudioId: string, targetCoachId: string, targetRoomId: string, offsetY: number) => void;
    onSlotClick?: (studioId: string, coachId: string, roomId: string, time: Date) => void;
}

const PIXELS_PER_MINUTE = 2;

const PlannerRoomSubColumn: React.FC<PlannerRoomSubColumnProps> = ({
    studioId,
    coachId,
    roomId,
    roomName,
    date,
    sessions,
    timeOffs,
    minTime,
    maxTime,
    onSessionClick,
    onDrop,
    onSlotClick
}) => {
    const timelineRef = useRef<HTMLDivElement>(null);

    // Drag preview state
    const [dragPreview, setDragPreview] = useState<{ top: number; timeLabel: string } | null>(null);

    const dayStart = minTime;
    const totalMinutes = differenceInMinutes(maxTime, minTime);
    const totalHeight = totalMinutes * PIXELS_PER_MINUTE;

    const getPosition = (start: Date, end: Date) => {
        const startDiff = differenceInMinutes(start, dayStart);
        const duration = differenceInMinutes(end, start);
        return {
            top: Math.max(0, startDiff * PIXELS_PER_MINUTE),
            height: duration * PIXELS_PER_MINUTE
        };
    };

    // Convert a Y offset (relative to the timeline container) to a snapped time
    const offsetToTime = useCallback((offsetY: number) => {
        const minutesOffset = offsetY / PIXELS_PER_MINUTE;
        const snappedMinutes = Math.round(minutesOffset / 15) * 15;
        return addMinutes(minTime, snappedMinutes);
    }, [minTime]);

    // Get offsetY relative to the timeline container
    const getTimelineOffsetY = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return 0;
        const rect = timelineRef.current.getBoundingClientRect();
        return e.clientY - rect.top;
    }, []);

    const renderGridLines = () => {
        const lines = [];
        let currentTime = dayStart;
        while (differenceInMinutes(currentTime, maxTime) < 0) {
            const top = differenceInMinutes(currentTime, dayStart) * PIXELS_PER_MINUTE;
            lines.push(
                <div
                    key={currentTime.toISOString()}
                    className="absolute w-full border-t border-gray-100 dark:border-slate-800"
                    style={{ top: `${top}px` }}
                />
            );
            lines.push(
                <div
                    key={`${currentTime.toISOString()}-30`}
                    className="absolute w-full border-t border-dashed border-gray-50 dark:border-slate-800/50"
                    style={{ top: `${top + (30 * PIXELS_PER_MINUTE)}px` }}
                />
            );
            currentTime = addMinutes(currentTime, 60);
        }
        return lines;
    };

    const renderTimeOffs = () => {
        return timeOffs.map((timeOff, i) => {
            const start = new Date(timeOff.startDate);
            const end = new Date(timeOff.endDate);

            const viewStart = set(date, { hours: minTime.getHours(), minutes: minTime.getMinutes() });
            const viewEnd = set(date, { hours: maxTime.getHours(), minutes: maxTime.getMinutes() });

            if (!areIntervalsOverlapping({ start, end }, { start: viewStart, end: viewEnd })) return null;

            const displayStart = start < viewStart ? viewStart : start;
            const displayEnd = end > viewEnd ? viewEnd : end;
            const { top, height } = getPosition(displayStart, displayEnd);

            return (
                <div
                    key={`timeoff-${i}`}
                    className="absolute w-full bg-gray-100/80 dark:bg-slate-800/80 border-y border-gray-200 dark:border-slate-700 repeating-lines z-20 flex items-center justify-center pointer-events-none cursor-not-allowed"
                    style={{ top: `${top}px`, height: `${height}px` }}
                >
                    <span className="text-xs font-semibold text-gray-400 rotate-90 whitespace-nowrap">
                        UNAVAILABLE
                    </span>
                </div>
            );
        });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Calculate preview position
        const offsetY = getTimelineOffsetY(e);
        const snappedTime = offsetToTime(offsetY);
        const snappedTop = (differenceInMinutes(snappedTime, minTime)) * PIXELS_PER_MINUTE;

        setDragPreview({
            top: Math.max(0, snappedTop),
            timeLabel: format(snappedTime, 'h:mm a')
        });
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        // Only clear if we actually left the container (not entering a child)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragPreview(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragPreview(null);

        try {
            const sessionData = e.dataTransfer.getData('application/json');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                const offsetY = getTimelineOffsetY(e);
                onDrop(session, studioId, coachId, roomId, offsetY);
            }
        } catch (err) {
            console.error('Failed to parse dropped session', err);
        }
    };

    return (
        <div className="flex-1 border-r border-gray-200 dark:border-slate-700 flex flex-col">
            {/* Header */}
            <div className="h-8 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {roomName}
                </span>
            </div>

            {/* Timeline */}
            <div
                ref={timelineRef}
                className={`relative flex-1 bg-white dark:bg-slate-900 transition-colors ${dragPreview ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                style={{ height: `${totalHeight}px`, minHeight: `${totalHeight}px` }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={(e) => {
                    // Only trigger if clicking the background, not a session card
                    // Session cards stop propagation usually, but just in case
                    if (e.target !== e.currentTarget && e.target !== timelineRef.current) return;

                    if (onSlotClick) {
                        // calculated inside click handler to avoid unused var warning if we extracted it before


                        if (timelineRef.current) {
                            const rect = timelineRef.current.getBoundingClientRect();
                            const clickY = e.clientY - rect.top;
                            const time = offsetToTime(clickY);
                            onSlotClick(studioId, coachId, roomId, time);
                        }
                    }
                }}
            >
                {/* Grid Lines */}
                {renderGridLines()}

                {/* Blocked Slots (Time Offs) */}
                {renderTimeOffs()}

                {/* Drop Preview Indicator */}
                {dragPreview && (
                    <div
                        className="absolute left-0 right-0 z-30 pointer-events-none"
                        style={{ top: `${dragPreview.top}px` }}
                    >
                        {/* Time label */}
                        <div className="absolute -top-3 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                            {dragPreview.timeLabel}
                        </div>
                        {/* Indicator line */}
                        <div className="w-full h-0.5 bg-blue-500 shadow-sm" />
                        {/* Ghost session area */}
                        <div className="w-full h-[60px] bg-blue-500/10 dark:bg-blue-400/10 border border-dashed border-blue-400/50 rounded-sm" />
                    </div>
                )}

                {/* Sessions */}
                {sessions.map((session, index) => {
                    const { top, height } = getPosition(new Date(session.startTime), new Date(session.endTime));
                    return (
                        <PlannerEventCard
                            key={session.id}
                            session={session}
                            index={index}
                            top={top}
                            height={height}
                            onClick={() => onSessionClick(session)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default PlannerRoomSubColumn;
