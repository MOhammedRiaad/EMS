
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import DataTable, { type Column } from '../../common/DataTable';
import { sessionsService, type Session } from '../../../services/sessions.service';

interface ClientSessionsTabProps {
    clientId: string;
}

const ClientSessionsTab: React.FC<ClientSessionsTabProps> = ({ clientId }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await sessionsService.getAll({ clientId });
            setSessions(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchSessions();
        }
    }, [clientId]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            scheduled: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            no_show: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs uppercase font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const columns: Column<Session>[] = [
        {
            key: 'startTime',
            header: 'Date & Time',
            render: (session) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {new Date(session.startTime).toLocaleDateString()}
                    </span>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (session) => getStatusBadge(session.status)
        },
        {
            key: 'coach',
            header: 'Coach',
            render: (session) => (
                <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                        {session.coach?.user ? `${session.coach.user.firstName} ${session.coach.user.lastName}` : 'Unassigned'}
                    </span>
                </div>
            )
        },
        {
            key: 'room',
            header: 'Room',
            render: (session) => (
                <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">
                        {session.room?.name || 'Unassigned'}
                    </span>
                </div>
            )
        },
        {
            key: 'notes',
            header: 'Notes',
            render: (session) => (
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {session.notes || '-'}
                </span>
            )
        }
    ];

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Session History</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                        Total: {sessions.length}
                    </span>
                </div>
                <DataTable
                    columns={columns}
                    data={sessions}
                    isLoading={loading}
                    emptyMessage="No sessions found for this client."
                />
            </div>
        </div>
    );
};

export default ClientSessionsTab;
