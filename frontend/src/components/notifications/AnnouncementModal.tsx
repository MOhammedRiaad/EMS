import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface Announcement {
    id: string;
    title: string;
    content: string;
    startDate: string;
    endDate?: string;
}


export const AnnouncementModal: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const checkForAnnouncements = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await api.get<Announcement[]>('/notifications/announcements/active');
            if (response.data && response.data.length > 0) {
                // Show the first one
                setCurrentAnnouncement(response.data[0]);
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Failed to check announcements', error);
        }
    };

    useEffect(() => {
        // Check on mount and route changes
        checkForAnnouncements();

        // Check periodically (every 5 mins)
        const interval = setInterval(checkForAnnouncements, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isAuthenticated, location.pathname]);

    // Force trigger on route change simulation (if using React Router, better to put this in layout effect)
    // But since this is mounted in layout, it persists. 
    // We can expose a ref or context to re-trigger, but polling + mount is usually enough.
    // However, user requested "force trigger". 
    // Let's hook into window focus or events if we wanted strict enforcement, 
    // but the best way is `useLocation` from react-router if available here.
    // Since we are inside Router context (in Layout), we can try to use it if we import it.

    // We will leave route change logic to the parent (Layout) or assumes Layout re-renders/checks.
    // Actually, if Layout doesn't unmount this, route changes won't re-trigger useEffect.
    // So we should listen to location changes.

    // BUT, we can't easily import `useLocation` here without ensuring this component is always under Router.
    // It is safe to assume it will be used in Layout which is under Router.

    const handleClose = async () => {
        if (!currentAnnouncement) return;

        try {
            await api.patch(`/notifications/announcements/${currentAnnouncement.id}/read`, {});
            setIsOpen(false);
            setCurrentAnnouncement(null);

            // Check for next one
            setTimeout(checkForAnnouncements, 500);
        } catch (error) {
            console.error('Failed to mark announcement as read', error);
        }
    };

    if (!isOpen || !currentAnnouncement) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {currentAnnouncement.title}
                        </h2>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: currentAnnouncement.content }} />
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Close & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
