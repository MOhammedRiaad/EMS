import React, { useEffect, useState } from 'react';
import { dashboardService, type DashboardStats } from '../../services/dashboard.service';
import { sessionsService, type Session } from '../../services/sessions.service';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, UserCheck, DollarSign, Clock, MapPin, Monitor } from 'lucide-react';
import Modal from '../../components/common/Modal';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
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

    useEffect(() => {
        fetchData();
    }, [currentWeekStart]);

    const fetchData = async () => {
        try {
            const startStr = currentWeekStart.toISOString();
            const end = new Date(currentWeekStart);
            end.setDate(end.getDate() + 7);
            const endStr = end.toISOString();

            const [statsData, sessionsData] = await Promise.all([
                dashboardService.getStats(),
                sessionsService.getAll({ from: startStr, to: endStr })
            ]);
            setStats(statsData);
            setSessions(sessionsData);
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

            {/* Calendar */}
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Weekly Schedule</h2>
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
                        <div key={date.toISOString()} style={{ minWidth: '140px', borderRight: '1px solid var(--border-color)', minHeight: '400px' }}>
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
                                            borderLeft: `3px solid ${getSessionColor(session.status)}`,
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{formatTime(session.startTime)}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                            <Users size={12} color="var(--color-text-secondary)" />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {session.client?.firstName} {session.client?.lastName}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                                            <MapPin size={12} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.room?.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Session Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Session Details">
                {selectedSession && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, padding: '0.25rem 0.5rem', borderRadius: '999px', backgroundColor: getSessionColor(selectedSession.status, true), color: getSessionColor(selectedSession.status) }}>
                                {selectedSession.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                {new Date(selectedSession.startTime).toLocaleDateString()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <DetailItem icon={<Clock size={16} />} label="Time" value={`${formatTime(selectedSession.startTime)} - ${formatTime(selectedSession.endTime)}`} />
                            <DetailItem icon={<MapPin size={16} />} label="Room" value={selectedSession.room?.name} />

                            <DetailItem icon={<Users size={16} />} label="Client" value={`${selectedSession.client?.firstName} ${selectedSession.client?.lastName}`} />
                            <DetailItem icon={<UserCheck size={16} />} label="Coach" value={`${selectedSession.coach?.user?.firstName || 'Unknown'} ${selectedSession.coach?.user?.lastName || 'Coach'}`} />

                            <DetailItem icon={<Monitor size={16} />} label="Program" value={selectedSession.programType || '-'} />
                            {/* Note: emsDeviceId logic assumes generic name if not populated, but session entity has ID. To show Label we might need to populate it. Leaving as is for now. */}
                        </div>

                        {selectedSession.notes && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Notes</label>
                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.875rem' }}>{selectedSession.notes}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
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

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
            {icon} {label}
        </div>
        <div style={{ fontWeight: 500 }}>{value || '-'}</div>
    </div>
);

const getSessionColor = (status: string, bg = false) => {
    switch (status) {
        case 'scheduled': return bg ? 'rgba(59, 130, 246, 0.1)' : '#3b82f6';
        case 'completed': return bg ? 'rgba(16, 185, 129, 0.1)' : '#10b981';
        case 'cancelled': return bg ? 'rgba(239, 68, 68, 0.1)' : '#ef4444';
        default: return bg ? 'rgba(107, 114, 128, 0.1)' : '#6b7280';
    }
};

export default Dashboard;
