import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, UserCheck, AlertTriangle, Package, Calendar, Info } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'client_arrival' | 'low_session' | 'session_reminder';
    readAt: string | null;
    createdAt: string;
    data?: any;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'client_arrival':
            return <UserCheck size={16} className="text-amber-500" />;
        case 'low_session':
            return <Package size={16} className="text-orange-500" />;
        case 'session_reminder':
            return <Calendar size={16} className="text-blue-500" />;
        case 'warning':
            return <AlertTriangle size={16} className="text-yellow-500" />;
        case 'error':
            return <AlertTriangle size={16} className="text-red-500" />;
        case 'success':
            return <Check size={16} className="text-green-500" />;
        default:
            return <Info size={16} className="text-blue-500" />;
    }
};

const getNotificationStyle = (type: string, isUnread: boolean) => {
    if (!isUnread) return '';
    switch (type) {
        case 'client_arrival':
            return 'bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-l-amber-500';
        case 'low_session':
            return 'bg-orange-50/50 dark:bg-orange-900/20 border-l-4 border-l-orange-500';
        case 'warning':
            return 'bg-yellow-50/50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500';
        case 'error':
            return 'bg-red-50/50 dark:bg-red-900/20 border-l-4 border-l-red-500';
        default:
            return 'bg-blue-50/30 dark:bg-blue-900/10';
    }
};

export const NotificationCenter: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const [listRes, countRes] = await Promise.all([
                api.get<Notification[]>('/notifications'),
                api.get<number>('/notifications/unread-count')
            ]);

            if (listRes.data) setNotifications(listRes.data);
            if (countRes.data !== undefined) setUnreadCount(countRes.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            // Poll every 30 seconds for high-priority notifications like client arrivals
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch('/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    // Check for high-priority unread notifications
    const hasHighPriority = notifications.some(n =>
        !n.readAt && (n.type === 'client_arrival' || n.type === 'warning' || n.type === 'error')
    );

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={`absolute top-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${hasHighPriority ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${getNotificationStyle(notification.type, !notification.readAt)}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${!notification.readAt ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!notification.readAt && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="shrink-0 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                                                    title="Mark as read"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

