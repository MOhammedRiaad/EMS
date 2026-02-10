import React, { useState, useEffect, useMemo } from 'react';
import { sessionsService } from '../../services/sessions.service';
import { format, addDays, subDays, startOfDay, addMinutes, differenceInMinutes, set } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useSessionsState } from './useSessionsState';
import { coachesService } from '../../services/coaches.service';
import PlannerStudioSection from './components/PlannerStudioSection';
import RescheduleConfirmModal from './components/RescheduleConfirmModal';
import CalendarDetailsPanel from './components/CalendarDetailsPanel';
import SessionDetailsModal from './SessionDetailsModal';
import { useNavigate } from 'react-router-dom';
import type { Session } from '../../services/sessions.service';
import { toast } from '../../utils/toast';

const PIXELS_PER_MINUTE = 2;

const DailyPlannerPage: React.FC = () => {
    const navigate = useNavigate();
    // State: We fetch all data, but useSessionsState rooms are dependent on studio selection.
    // So we need to fetch ALL rooms manually to show the full planner.
    // We ignore the rooms from useSessionsState (allRooms) as they might be empty if no studio selected in form context
    const { sessions, refresh, studios, coaches: allCoaches, loading, setSelectedSession: setGlobalSelectedSession } = useSessionsState();

    // Local rooms state to hold ALL rooms
    const [allRooms, setAllRooms] = useState<any[]>([]);

    const [date, setDate] = useState(new Date());
    const [timeOffs, setTimeOffs] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [pendingReschedule, setPendingReschedule] = useState<{
        session: Session;
        newStartTime: Date;
        newEndTime: Date;
        newCoachId: string;
        newRoomId: string;
        newStudioId: string;
    } | null>(null);

    // Fetch time-offs
    useEffect(() => {
        coachesService.getTimeOffRequests('approved').then(setTimeOffs).catch(console.error);
    }, []);

    // Fetch all rooms on mount
    useEffect(() => {
        // Dynamic import to avoid circular dependencies if any, though standard import is fine usually.
        // Using standard import logic here but fetching directly.
        import('../../services/rooms.service').then(({ roomsService }) => {
            roomsService.getAll().then(setAllRooms).catch(console.error);
        });
    }, []);

    // Filter sessions for the selected date
    const dailySessions = useMemo(() => {
        const start = startOfDay(date);
        const end = addDays(start, 1);
        return sessions.filter(s => {
            const sDate = new Date(s.startTime);
            return sDate >= start && sDate < end;
        });
    }, [sessions, date]);

    // Calculate dynamic min/max time based on studio hours
    const { minTime, maxTime } = useMemo(() => {
        let earliest = 6 * 60; // Default 06:00
        let latest = 23 * 60;  // Default 23:00

        if (studios.length > 0) {
            let hasHours = false;
            let tempEarliest = 24 * 60;
            let tempLatest = 0;

            const dayName = format(date, 'EEEE').toLowerCase();

            studios.forEach(studio => {
                if (studio.openingHours && (studio.openingHours as any)[dayName]) {
                    const hours = (studio.openingHours as any)[dayName];
                    if (hours) {
                        hasHours = true;
                        const [openH, openM] = hours.open.split(':').map(Number);
                        const [closeH, closeM] = hours.close.split(':').map(Number);

                        const openMins = openH * 60 + openM;
                        const closeMins = closeH * 60 + closeM;

                        if (openMins < tempEarliest) tempEarliest = openMins;
                        if (closeMins > tempLatest) tempLatest = closeMins;
                    }
                }
            });

            if (hasHours) {
                earliest = tempEarliest;
                latest = tempLatest;
            }
        }

        const min = set(date, { hours: Math.floor(earliest / 60), minutes: earliest % 60, seconds: 0, milliseconds: 0 });
        const max = set(date, { hours: Math.floor(latest / 60), minutes: latest % 60, seconds: 0, milliseconds: 0 });

        // Ensure max is at least 1 hour after min
        if (differenceInMinutes(max, min) < 60) {
            return { minTime: min, maxTime: addMinutes(min, 60) };
        }

        return { minTime: min, maxTime: max };
    }, [studios, date]);

    // Handle Drop Logic
    const handleDrop = (session: Session, targetStudioId: string, targetCoachId: string, targetRoomId: string, offsetY: number) => {
        // Calculate Time
        const minutesOffset = offsetY / PIXELS_PER_MINUTE;
        // Snap to nearest 15 mins
        const snappedMinutes = Math.round(minutesOffset / 15) * 15;

        const newStart = addMinutes(minTime, snappedMinutes);
        const duration = differenceInMinutes(new Date(session.endTime), new Date(session.startTime));
        const newEnd = addMinutes(newStart, duration);

        setPendingReschedule({
            session,
            newStartTime: newStart,
            newEndTime: newEnd,
            newCoachId: targetCoachId,
            newRoomId: targetRoomId,
            newStudioId: targetStudioId
        });
        setModalOpen(true);
    };

    const confirmReschedule = async () => {
        if (!pendingReschedule) return;
        setUpdating(true);
        try {
            const payload = {
                startTime: pendingReschedule.newStartTime.toISOString(),
                endTime: pendingReschedule.newEndTime.toISOString(),
                coachId: pendingReschedule.newCoachId,
                roomId: pendingReschedule.newRoomId,
                studioId: pendingReschedule.newStudioId,
                type: pendingReschedule.session.type,
                capacity: pendingReschedule.session.capacity,
                allowTimeChangeOverride: true
            };
            await sessionsService.update(pendingReschedule.session.id, payload);
            toast.success('Session rescheduled successfully');
            await refresh();
            setModalOpen(false);
            setPendingReschedule(null);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to reschedule');
        } finally {
            setUpdating(false);
        }
    };

    // Helper to get names for modal
    const getModalData = () => {
        if (!pendingReschedule) return null;
        const { session, newCoachId, newRoomId, newStartTime } = pendingReschedule;

        const oldCoach = allCoaches.find(c => c.id === session.coachId);
        const newCoach = allCoaches.find(c => c.id === newCoachId);

        const oldRoom = allRooms.find(r => r.id === session.roomId);
        const newRoom = allRooms.find(r => r.id === newRoomId);

        const clientName = session.client
            ? `${session.client.firstName} ${session.client.lastName}`
            : session.lead
                ? `${session.lead.firstName} ${session.lead.lastName} (Lead)`
                : 'Group Session';

        return {
            clientName,
            oldDate: new Date(session.startTime),
            newDate: newStartTime,
            oldCoachName: oldCoach ? `${oldCoach.firstName} ${oldCoach.lastName}` : 'Unknown',
            newCoachName: newCoach ? `${newCoach.firstName} ${newCoach.lastName}` : 'Unknown',
            oldRoomName: oldRoom?.name || 'Unknown',
            newRoomName: newRoom?.name || 'Unknown'
        };
    };

    if (loading && !sessions.length) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Daily Planner</h1>
                    <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                        <button onClick={() => setDate(d => subDays(d, 1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors"><ChevronLeft size={20} /></button>
                        <span className="px-4 font-semibold text-gray-700 dark:text-gray-200 min-w-[140px] text-center">
                            {format(date, 'EEE, MMM d')}
                        </span>
                        <button onClick={() => setDate(d => addDays(d, 1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors"><ChevronRight size={20} /></button>
                        <button onClick={() => setDate(new Date())} className="ml-2 text-xs font-semibold px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">Today</button>
                    </div>
                </div>
                <button onClick={refresh} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-x-auto overflow-y-auto relative">
                <div className="flex min-h-full min-w-full p-4 pb-2">
                    {/* Time Axis (Sticky Left) */}
                    <div className="sticky left-0 z-40 bg-gray-50 dark:bg-slate-900 pr-4 border-r border-gray-200 dark:border-slate-700 relative select-none pointer-events-none w-16 text-right text-xs font-medium text-gray-400">
                        {/* Header Spacer to align with planner headers: Studio(??) + Coach(??) + Room(32px) */}
                        {/* Wait, we have multiple headers.
                             PlannerStudioSection: Studio Header (approx 45px?)
                             PlannerCoachColumn: Coach Header (approx 80px?)
                             PlannerRoomSubColumn: Room Header (32px)
                             
                             We need to match the vertical offset of the grid start.
                             The grid starts AFTER all headers.
                             
                             Let's check heights:
                             PlannerStudioSection:
                               Header: p-3 (12px top/bottom + line height) -> approx 48px
                             PlannerCoachColumn:
                               Header: p-3 -> approx ~80-90px? (avatar + text)
                             PlannerRoomSubColumn:
                               Header: h-8 (32px)
                             
                             Total offset = StudioHeader + CoachHeader + RoomHeader.
                             This is variable!
                             
                             BETTER APPROACH:
                             The Time Axis should START at the same Y position as the grid.
                             The grid is inside `PlannerRoomSubColumn`.
                             
                             If we put the Time Axis *outside*, we need to match the header heights.
                             Alternatively, we can render the time axis *inside* the first column of the first studio?
                             Or just hardcode the top margin to match the header stack.
                             
                             Let's estimate the header stack height:
                             Studio Header: p-3 (0.75rem * 16 = 12px). Text is base/lg. Let's say ~45px.
                             Coach Header: p-3. Avatar 10 (2.5rem=40px). Text. MB-2. ~100px?
                             Room Header: h-8 (32px).
                             
                             Total ~180px?
                             
                             Actually, if we look at the screenshot:
                             Studio 1 header.
                             Coach A header.
                             "No Rooms Configured" placeholder.
                             
                             The time axis "9 AM" is aligned with... well, it looks like it's just there.
                             
                             Let's try to match the header structure in the Time Axis column visually.
                             Or simple spacer.
                         */}
                        <div className="flex flex-col opacity-0 pointer-events-none">
                            {/* Mimic Header Heights roughly */}
                            <div className="p-3 border-b flex items-center gap-2"><div className="h-[24px]"></div>Studio</div>
                            <div className="p-3 mb-2 flex flex-col items-center"><div className="w-10 h-10"></div><div className="h-4"></div></div>
                            <div className="h-8"></div>
                        </div>

                        {/* Time Labels */}
                        <div className="relative w-full h-full pt-4">
                            {Array.from({ length: Math.ceil(differenceInMinutes(maxTime, minTime) / 60) + 1 }).map((_, i) => {
                                const t = addMinutes(minTime, i * 60);
                                if (t > maxTime) return null;
                                return (
                                    <div key={i} className="absolute w-full text-right pr-2 transform -translate-y-1/2" style={{ top: `${i * 60 * PIXELS_PER_MINUTE}px` }}>
                                        {format(t, 'h a')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Studios - fill all available width */}
                    <div className="flex flex-1 gap-2 pl-2 w-full">
                        {studios.map(studio => (
                            <PlannerStudioSection
                                key={studio.id}
                                studio={studio}
                                coaches={allCoaches}
                                rooms={allRooms}
                                date={date}
                                sessions={dailySessions.filter(s => s.studioId === studio.id)}
                                timeOffs={timeOffs}
                                minTime={minTime}
                                maxTime={maxTime}
                                onSessionClick={(s) => setSelectedSession(s)}
                                onDrop={handleDrop}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Details Panel */}
            {selectedSession && (
                <div className="absolute right-0 top-16 bottom-0 z-50">
                    <CalendarDetailsPanel
                        date={date}
                        selectedSession={selectedSession}
                        sessionsToday={dailySessions}
                        onClose={() => setSelectedSession(null)}
                        onViewDetails={() => {
                            setGlobalSelectedSession(selectedSession);
                            setDetailsModalOpen(true);
                        }}
                        onCreateSession={() => navigate('/sessions/new')}
                    />
                </div>
            )}

            <RescheduleConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={confirmReschedule}
                sessionData={getModalData()}
                isUpdating={updating}
            />

            <SessionDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                session={selectedSession}
                onSessionUpdated={refresh}
            />
        </div>
    );
};

export default DailyPlannerPage;
