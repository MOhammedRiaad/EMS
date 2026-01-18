import { useState, useEffect } from 'react';
import { coachPortalService } from '../../services/coach-portal.service';
import { Search, User, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import { Link } from 'react-router-dom';

const CoachClients = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadClients = async () => {
            try {
                const data = await coachPortalService.getMyClients();
                setClients(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadClients();
    }, []);

    const filteredClients = clients.filter(c =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );

    return (
        <div className="max-w-lg mx-auto space-y-4">
            <h1 className="text-xl font-bold text-gray-900 mb-4 px-2">My Clients</h1>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
            </div>

            <div className="space-y-2">
                {filteredClients.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No clients found to display.
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <Link
                            key={client.id}
                            to={`/coach/clients/${client.id}`}
                            className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-gray-500 font-bold mr-4 border border-gray-200">
                                {client.avatarUrl ? (
                                    <img
                                        src={getImageUrl(client.avatarUrl) || ''}
                                        alt={client.firstName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                                <div className="hidden absolute">
                                    <User size={20} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900">{client.firstName} {client.lastName}</div>
                                <div className="text-xs text-gray-500">{client.email}</div>
                            </div>
                            <ChevronRight className="text-gray-300" size={20} />
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default CoachClients;
