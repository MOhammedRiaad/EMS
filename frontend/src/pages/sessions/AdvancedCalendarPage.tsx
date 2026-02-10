import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './AdvancedCalendar.css';

import { useSessionsState } from './useSessionsState';
import CalendarToolbar from './components/CalendarToolbar';
import CalendarSidebar from './components/CalendarSidebar';
import CalendarDetailsPanel from './components/CalendarDetailsPanel';
import CalendarEvent from './components/CalendarEvent';
import SessionDetailsModal from './SessionDetailsModal';
import RescheduleConfirmModal from './components/RescheduleConfirmModal';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { sessionsService, type Session } from '../../services/sessions.service';
import { coachesService } from '../../services/coaches.service';
import { roomsService } from '../../services/rooms.service';
import { studiosService } from '../../services/studios.service';
import { toast } from '../../utils/toast';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const DnDCalendar = withDragAndDrop(Calendar as any);

type ResourceType = 'coach' | 'room' | 'studio';

interface Resource {
    id: string;
    title: string;
    type: ResourceType;
    studioId?: string;
}

const AdvancedCalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        sessions,
        loading,
        selectedSession,
        refresh,
        setSelectedSession,
        studios
    } = useSessionsState();

    // Default to Day view for daily schedule focus
    const [view, setView] = useState<View>(Views.DAY);
    const [date, setDate] = useState(new Date());
    const [resourceType, setResourceType] = useState<ResourceType>('room');
    const [resources, setResources] = useState<Resource[]>([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Reschedule state
    const [pendingReschedule, setPendingReschedule] = useState<{
        session: Session;
        newStartTime: Date;
        newEndTime: Date;
        newResourceId?: string;
    } | null>(null);
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Fetch rooms and coaches for filters
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [allCoaches, setAllCoaches] = useState<any[]>([]);

    // Filter selections (empty = all selected)
    const [selectedStudioIds, setSelectedStudioIds] = useState<string[]>([]);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);

    // Fetch filter data
    useEffect(() => {
        roomsService.getAll().then(setAllRooms).catch(console.error);
        coachesService.getAll().then(setAllCoaches).catch(console.error);
    }, []);

    // Fetch resources based on selected type
    useEffect(() => {
        const fetchResources = async () => {
            try {
                let data: Resource[] = [];
                if (resourceType === 'coach') {
                    const coachesData = await coachesService.getAll();
                    data = coachesData.map(c => ({
                        id: c.id,
                        title: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown Coach',
                        type: 'coach',
                        studioId: c.studioId
                    }));
                } else if (resourceType === 'room') {
                    const roomsData = await roomsService.getAll();
                    data = roomsData.map(r => ({ id: r.id, title: r.name, type: 'room', studioId: r.studioId }));
                } else if (resourceType === 'studio') {
                    const studiosData = await studiosService.getAll();
                    data = studiosData.map(s => ({ id: s.id, title: s.name, type: 'studio' }));
                }
                setResources(data);
            } catch (error) {
                console.error('Failed to fetch resources', error);
            }
        };
        fetchResources();
    }, [resourceType]);

    // Fetch time-off requests
    const [timeOffs, setTimeOffs] = useState<any[]>([]);
    useEffect(() => {
        if (resourceType === 'coach') {
            coachesService.getTimeOffRequests('approved').then(setTimeOffs).catch(console.error);
        } else {
            setTimeOffs([]);
        }
    }, [resourceType]);

    // Background events for time-offs
    const backgroundEvents = useMemo(() => {
        return timeOffs.map(t => ({
            id: t.id,
            title: 'Time Off',
            start: new Date(t.startDate),
            end: new Date(t.endDate),
            resourceId: t.coachId,
            type: 'time-off',
            isDraggable: false,
            isResizable: false,
            allDay: true,
            resource: { id: t.coachId, title: 'Coach Time Off', type: 'coach' }
        }));
    }, [timeOffs]);

    const slotPropGetter = useCallback((slotDate: Date, resourceId?: string | number) => {
        if (view === Views.MONTH) return {};
        if (!resourceId) return {};

        let studioId: string | undefined;
        if (resourceType === 'studio') {
            studioId = resourceId as string;
        } else if (resourceType === 'coach') {
            const coachRes = resources.find(r => r.id === resourceId);
            if (coachRes) studioId = coachRes.studioId;
        } else if (resourceType === 'room') {
            const roomRes = resources.find(r => r.id === resourceId);
            if (roomRes) studioId = roomRes.studioId;
        }

        if (!studioId) return {};

        const studio = studios.find(s => s.id === studioId);
        if (!studio || !studio.openingHours) return {};

        const dayName = format(slotDate, 'EEEE').toLowerCase();
        const hours = studio.openingHours[dayName];

        if (!hours) {
            return { style: { backgroundColor: 'rgba(200, 200, 200, 0.1)', cursor: 'not-allowed' } };
        }

        const currentTime = format(slotDate, 'HH:mm');
        if (currentTime < hours.open || currentTime >= hours.close) {
            return { style: { backgroundColor: 'rgba(200, 200, 200, 0.1)', cursor: 'not-allowed' } };
        }

        return {};
    }, [resourceType, resources, studios, view]);

    // Apply filters to sessions
    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            if (selectedStudioIds.length > 0 && !selectedStudioIds.includes(session.studioId)) return false;
            if (selectedRoomIds.length > 0 && session.roomId && !selectedRoomIds.includes(session.roomId)) return false;
            if (selectedCoachIds.length > 0 && session.coachId && !selectedCoachIds.includes(session.coachId)) return false;
            return true;
        });
    }, [sessions, selectedStudioIds, selectedRoomIds, selectedCoachIds]);

    const events = useMemo(() => {
        return filteredSessions.map(session => ({
            id: session.id,
            title: `${session.client
                ? `${session.client.firstName} ${session.client.lastName}`
                : session.lead
                    ? `${session.lead.firstName} ${session.lead.lastName} (Lead)`
                    : 'Group Session'} (${session.programType})`,
            start: new Date(session.startTime),
            end: new Date(session.endTime),
            resourceId: resourceType === 'coach' ? session.coachId :
                resourceType === 'room' ? session.roomId :
                    session.studioId,
            data: session
        }));
    }, [filteredSessions, resourceType]);

    // Sessions for the selected day (for right panel)
    const sessionsToday = useMemo(() => {
        return filteredSessions.filter(s => isSameDay(new Date(s.startTime), date));
    }, [filteredSessions, date]);

    // Calculate min/max time based on studio opening hours
    const { minTime, maxTime } = useMemo(() => {
        let minStr = '06:00';
        let maxStr = '23:00';

        if (studios.length > 0) {
            let earliest = '23:59';
            let latest = '00:00';
            let hasHours = false;

            studios.forEach(studio => {
                if (studio.openingHours) {
                    Object.values(studio.openingHours).forEach(dayHours => {
                        if (dayHours) {
                            hasHours = true;
                            if ((dayHours as any).open < earliest) earliest = (dayHours as any).open;
                            if ((dayHours as any).close > latest) latest = (dayHours as any).close;
                        }
                    });
                }
            });

            if (hasHours) {
                minStr = earliest;
                maxStr = latest;
            }
        }

        const min = new Date();
        const [minH, minM] = minStr.split(':');
        min.setHours(parseInt(minH), parseInt(minM), 0, 0);

        const max = new Date();
        const [maxH, maxM] = maxStr.split(':');
        max.setHours(parseInt(maxH), parseInt(maxM), 0, 0);

        return { minTime: min, maxTime: max };
    }, [studios]);

    const handleEventDrop = async ({ event, start, end, resourceId }: any) => {
        const session = event.data as Session;
        const newStart = new Date(start);
        const newEnd = new Date(end);

        setPendingReschedule({
            session,
            newStartTime: newStart,
            newEndTime: newEnd,
            newResourceId: resourceId || undefined,
        });
        setRescheduleModalOpen(true);
    };

    const confirmReschedule = async () => {
        if (!pendingReschedule) return;
        setUpdating(true);
        try {
            const payload: any = {
                startTime: pendingReschedule.newStartTime.toISOString(),
                endTime: pendingReschedule.newEndTime.toISOString(),
                studioId: pendingReschedule.session.studioId,
                roomId: pendingReschedule.session.roomId,
                coachId: pendingReschedule.session.coachId,
                type: pendingReschedule.session.type,
                capacity: pendingReschedule.session.capacity,
                allowTimeChangeOverride: true,
            };

            // Update resource based on the resource type of the calendar view
            if (pendingReschedule.newResourceId) {
                if (resourceType === 'coach') payload.coachId = pendingReschedule.newResourceId;
                if (resourceType === 'room') payload.roomId = pendingReschedule.newResourceId;
                if (resourceType === 'studio') payload.studioId = pendingReschedule.newResourceId;
            }

            await sessionsService.update(pendingReschedule.session.id, payload);
            toast.success('Session rescheduled successfully');
            await refresh();
            setRescheduleModalOpen(false);
            setPendingReschedule(null);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to reschedule');
        } finally {
            setUpdating(false);
        }
    };

    const getModalData = () => {
        if (!pendingReschedule) return null;
        const { session } = pendingReschedule;

        const clientName = session.client
            ? `${session.client.firstName} ${session.client.lastName}`
            : session.lead
                ? `${session.lead.firstName} ${session.lead.lastName} (Lead)`
                : 'Group Session';

        const oldCoachName = session.coach?.user
            ? `${session.coach.user.firstName} ${session.coach.user.lastName}`
            : 'Unknown';
        const oldRoomName = session.room?.name || 'Unknown';

        let newCoachName = oldCoachName;
        let newRoomName = oldRoomName;

        if (pendingReschedule.newResourceId) {
            if (resourceType === 'coach') {
                const coach = allCoaches.find((c: any) => c.id === pendingReschedule.newResourceId);
                newCoachName = coach ? `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || 'Unknown Coach' : 'Unknown Coach';
            }
            if (resourceType === 'room') {
                const room = allRooms.find((r: any) => r.id === pendingReschedule.newResourceId);
                newRoomName = room?.name || 'Unknown';
            }
        }

        return {
            clientName,
            oldDate: new Date(session.startTime),
            newDate: pendingReschedule.newStartTime,
            oldCoachName,
            newCoachName,
            oldRoomName,
            newRoomName,
        };
    };

    const handleSelectSlot = ({ start, end, resourceId }: any) => {
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        const params = new URLSearchParams({
            startTime: start.toISOString(),
            duration: duration.toString()
        });

        if (resourceId) {
            if (resourceType === 'coach') params.set('coachId', resourceId);
            if (resourceType === 'room') params.set('roomId', resourceId);
            if (resourceType === 'studio') params.set('studioId', resourceId);
        }

        navigate(`/sessions/new?${params.toString()}`);
    };

    const handleSelectEvent = (event: any) => {
        setSelectedSession(event.data);
        // Don't open the full modal, just highlight in the side panel
    };

    const eventStyleGetter = (event: any) => {
        const session = event.data as Session;
        let className = `status-${session.status}`;
        if (session.lead) className += ' is-lead';
        return { className };
    };

    // Toggle filter handlers
    const handleStudioToggle = (id: string) => {
        setSelectedStudioIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleRoomToggle = (id: string) => {
        setSelectedRoomIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleCoachToggle = (id: string) => {
        setSelectedCoachIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Components for react-big-calendar
    const components = useMemo(() => ({
        toolbar: (props: any) => (
            <CalendarToolbar
                {...props}
                onNewSession={() => navigate('/sessions/new')}
            />
        ),
        event: CalendarEvent as any
    }), [navigate]);

    return (
        <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-slate-900">
            {/* Left Sidebar */}
            <CalendarSidebar
                date={date}
                onNavigate={setDate}
                studios={studios}
                rooms={allRooms}
                coaches={allCoaches}
                selectedStudioIds={selectedStudioIds}
                selectedRoomIds={selectedRoomIds}
                selectedCoachIds={selectedCoachIds}
                onStudioToggle={handleStudioToggle}
                onRoomToggle={handleRoomToggle}
                onCoachToggle={handleCoachToggle}
                resourceType={resourceType}
                setResourceType={setResourceType}
            />

            {/* Center: Calendar */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {loading && !sessions.length ? (
                    <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        backgroundEvents={backgroundEvents}
                        startAccessor={(e: any) => e.start}
                        endAccessor={(e: any) => e.end}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        selectable
                        resizable
                        onEventDrop={handleEventDrop}
                        onEventResize={handleEventDrop}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        resources={resources}
                        resourceIdAccessor={(r: any) => r.id}
                        resourceTitleAccessor={(r: any) => r.title}
                        eventPropGetter={eventStyleGetter}
                        slotPropGetter={slotPropGetter}
                        components={components}
                        step={15}
                        timeslots={4}
                        min={minTime}
                        max={maxTime}
                        className="flex-1 bg-white dark:bg-slate-800"
                    />
                )}
            </main>

            {/* Right Sidebar - Only show when session is selected */}
            {selectedSession && (
                <CalendarDetailsPanel
                    date={date}
                    selectedSession={selectedSession}
                    sessionsToday={sessionsToday}
                    onClose={() => setSelectedSession(null)}
                    onViewDetails={() => setIsDetailsModalOpen(true)}
                    onCreateSession={() => navigate('/sessions/new')}
                />
            )}

            {/* Full Details Modal */}
            <SessionDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                session={selectedSession}
                onSessionUpdated={refresh}
            />

            {/* Reschedule Confirmation Modal */}
            {rescheduleModalOpen && getModalData() && (
                <RescheduleConfirmModal
                    isOpen={rescheduleModalOpen}
                    onClose={() => {
                        setRescheduleModalOpen(false);
                        setPendingReschedule(null);
                    }}
                    onConfirm={confirmReschedule}
                    sessionData={getModalData()}
                    isUpdating={updating}
                />
            )}
        </div>
    );
};

export default AdvancedCalendarPage;
