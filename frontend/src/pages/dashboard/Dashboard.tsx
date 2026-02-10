import React, { useEffect, useState } from 'react';
import { dashboardService, type DashboardStats } from '../../services/dashboard.service';
import { sessionsService, type Session } from '../../services/sessions.service';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, DollarSign, UserCheck, MapPin } from 'lucide-react';
import NotificationsWidget from '../../components/dashboard/NotificationsWidget';
import CalendarSyncWidget from '../../components/dashboard/CalendarSyncWidget';
import SessionDetailsModal from '../sessions/SessionDetailsModal';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    });
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { isEnabled } = useAuth();
    useEffect(() => {
        fetchData();
    }, [currentWeekStart]);

    const fetchData = async () => {
        try {
            const startStr = currentWeekStart.toISOString();
            const end = new Date(currentWeekStart);
            end.setDate(end.getDate() + 7);
            const endStr = end.toISOString();

            const [statsData, sessionsData, coachesData] = await Promise.all([
                dashboardService.getStats(),
                sessionsService.getAll({ from: startStr, to: endStr }),
                coachesService.getAll()
            ]);
            setStats(statsData);
            setSessions(sessionsData);
            setCoaches(coachesData.filter(c => c.active));
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const getSessionsForDate = (date: Date) => {
        return sessions.filter(s => {
            const sDate = new Date(s.startTime);
            return sDate.getDate() === date.getDate() &&
                sDate.getMonth() === date.getMonth() &&
                sDate.getFullYear() === date.getFullYear();
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    };

    const getTodaysSessionsForCoach = (coachId: string) => {
        const today = new Date();
        return sessions.filter(s => {
            const sDate = new Date(s.startTime);
            return s.coachId === coachId &&
                sDate.getDate() === today.getDate() &&
                sDate.getMonth() === today.getMonth() &&
                sDate.getFullYear() === today.getFullYear();
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSessionClick = (session: Session) => {
        setSelectedSession(session);
        setIsDetailModalOpen(true);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header & Stats */}
            <div>
                <h1 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Dashboard</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <StatCard
                        title="Today's Sessions"
                        value={stats?.todaySessions ?? '-'}
                        icon={<CalendarIcon size={20} color="var(--color-primary)" />}
                    />
                    <StatCard
                        title="Active Clients"
                        value={stats?.activeClients ?? '-'}
                        icon={<Users size={20} color="#10b981" />}
                    />
                    <StatCard
                        title="Active Coaches"
                        value={stats?.activeCoaches ?? '-'}
                        icon={<UserCheck size={20} color="#3b82f6" />}
                    />
                    <StatCard
                        title="Est. Revenue (Month)"
                        value={`€${stats?.revenue ?? '-'}`}
                        icon={<DollarSign size={20} color="#f59e0b" />}
                    />
                </div>
            </div>

            {/* Today's Schedule Per Coach */}
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Today's Overview</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, coaches.length)}, 1fr)`, overflowX: 'auto', minHeight: '300px' }}>
                    {coaches.length > 0 ? coaches.map(coach => {
                        const coachSessions = getTodaysSessionsForCoach(coach.id);
                        return (
                            <div key={coach.id} style={{ borderRight: '1px solid var(--border-color)', minWidth: '250px' }}>
                                <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                                        {coach.firstName[0]}{coach.lastName[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{coach.firstName} {coach.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{coachSessions.length} sessions</div>
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {coachSessions.length > 0 ? coachSessions.map(session => (
                                        <div
                                            key={session.id}
                                            onClick={() => handleSessionClick(session)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                backgroundColor: 'var(--color-bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderLeft: `3px solid ${getSessionColor(session.status, false, !!session.lead)}`,
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                transition: 'transform 0.1s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatTime(session.startTime)}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '1px 6px', borderRadius: '4px', backgroundColor: getSessionColor(session.status, true, !!session.lead), color: getSessionColor(session.status, false, !!session.lead) }}>
                                                    {session.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', marginBottom: '2px' }}>
                                                <Users size={14} color="var(--color-text-secondary)" />
                                                <span style={{ fontWeight: 500 }}>
                                                    {session.type === 'group'
                                                        ? `Group Session (${session.participants?.length || 0})`
                                                        : session.client
                                                            ? `${session.client.firstName} ${session.client.lastName}`
                                                            : session.lead
                                                                ? `${session.lead.firstName} ${session.lead.lastName} (Lead)`
                                                                : 'Unknown Client'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                <MapPin size={12} />
                                                <span>{session.room?.name || 'Studio'}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                            No sessions today
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>No active coaches found</div>
                    )}
                </div>
            </div>

            {/* Two Column Layout: Weekly Calendar and Notifications */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Weekly Overview</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                {currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button onClick={handlePrevWeek} style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
                                <button onClick={handleNextWeek} style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}><ChevronRight size={20} /></button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', overflowX: 'auto' }}>
                        {weekDates.map((date) => (
                            <div key={date.toISOString()} style={{ minWidth: '140px', borderRight: '1px solid var(--border-color)', minHeight: '300px' }}>
                                <div style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--color-bg-primary)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>{date.getDate()}</div>
                                </div>
                                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {getSessionsForDate(date).map(session => (
                                        <div
                                            key={session.id}
                                            onClick={() => handleSessionClick(session)}
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--color-bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderLeft: `3px solid ${getSessionColor(session.status, false, !!session.lead)}`,
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{formatTime(session.startTime)}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                                <Users size={12} color="var(--color-text-secondary)" />
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {session.type === 'group'
                                                        ? `Group (${session.participants?.length || 0})`
                                                        : session.client
                                                            ? `${session.client.firstName} ${session.client.lastName}`
                                                            : session.lead
                                                                ? `${session.lead.firstName} ${session.lead.lastName} (Lead)`
                                                                : 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Sidebar Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <NotificationsWidget />
                    {isEnabled("core.calendar_sync") && <CalendarSyncWidget />}
                </div>

                {/* Session Detail Modal */}
                <SessionDetailsModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    session={selectedSession}
                    onSessionUpdated={() => {
                        fetchData();
                        setIsDetailModalOpen(false);
                    }}
                />
            </div>


        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{value}</p>
        </div>
    </div>
);

const getSessionColor = (status: string, bg = false, isLead = false) => {
    if (isLead) return bg ? 'rgba(147, 51, 234, 0.1)' : '#9333ea'; // Purple for leads
    switch (status) {
        case 'scheduled': return bg ? 'rgba(59, 130, 246, 0.1)' : '#3b82f6';
        case 'completed': return bg ? 'rgba(16, 185, 129, 0.1)' : '#10b981';
        case 'cancelled': return bg ? 'rgba(239, 68, 68, 0.1)' : '#ef4444';
        default: return bg ? 'rgba(107, 114, 128, 0.1)' : '#6b7280';
    }
};

export default Dashboard;
