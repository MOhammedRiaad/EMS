import { useEffect, useState } from 'react';
import { Dumbbell, Trophy, Clock } from 'lucide-react';
import { clientPortalService } from '../../../services/client-portal.service';
import { getImageUrl } from '../../../utils/imageUtils';

interface FeedItem {
    id: string;
    type: 'session' | 'achievement';
    date: string;
    clientName: string;
    clientInitial: string;
    avatarUrl?: string;
    title: string;
    details?: string;
}

const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export const ActivityFeed = () => {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const data = await clientPortalService.getActivityFeed();
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, []);

    if (loading) return <div className="animate-pulse p-4 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
    </div>;

    if (items.length === 0) return (
        <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            No recent activity. Be the first to start!
        </div>
    );

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-blue-500" />
                Studio Activity
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-3 items-start animate-fade-in-up relative">
                        <div className="flex-shrink-0 relative">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {item.avatarUrl && getImageUrl(item.avatarUrl) ? (
                                    <img src={getImageUrl(item.avatarUrl)!} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="font-bold text-gray-500 text-sm">
                                        {item.clientName[0]}{item.clientInitial}
                                    </div>
                                )}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-gray-800 text-[10px] ${item.type === 'achievement' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}>
                                {item.type === 'achievement' ? <Trophy size={10} /> : <Dumbbell size={10} />}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {item.clientName} {item.clientInitial}.
                                </p>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(item.date)}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                {item.title}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
