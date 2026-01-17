import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Package, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    type: 'session_today' | 'session_upcoming' | 'package_expiring' | 'package_low';
    title: string;
    message: string;
    link?: string;
    priority: 'high' | 'medium' | 'low';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const NotificationsWidget: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/notifications/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'session_today':
            case 'session_upcoming':
                return <Calendar size={16} />;
            case 'package_expiring':
            case 'package_low':
                return <Package size={16} />;
            default:
                return <Bell size={16} />;
        }
    };

    const getPriorityColor = (priority: Notification['priority']) => {
        switch (priority) {
            case 'high': return 'var(--color-danger)';
            case 'medium': return 'var(--color-warning)';
            default: return 'var(--color-primary)';
        }
    };

    const handleClick = (notification: Notification) => {
        if (notification.link) {
            navigate(notification.link);
        }
    };

    if (loading) {
        return (
            <div style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Bell size={20} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 600 }}>Notifications</span>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '1rem' }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={20} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 600 }}>Notifications</span>
                    {notifications.length > 0 && (
                        <span style={{
                            backgroundColor: 'var(--color-danger)',
                            color: 'white',
                            borderRadius: '9999px',
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            {notifications.length}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--color-text-secondary)'
                    }}>
                        <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <div>No notifications</div>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleClick(notification)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                cursor: notification.link ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: `${getPriorityColor(notification.priority)}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: getPriorityColor(notification.priority),
                                flexShrink: 0
                            }}>
                                {getIcon(notification.type)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                    {notification.title}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-secondary)',
                                    marginTop: '0.125rem'
                                }}>
                                    {notification.message}
                                </div>
                            </div>
                            {notification.link && (
                                <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsWidget;
