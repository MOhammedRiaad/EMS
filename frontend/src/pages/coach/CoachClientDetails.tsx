import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coachPortalService } from '../../services/coach-portal.service';
import { User, Activity, Calendar, Plus } from 'lucide-react';
import InBodyTrendsChart from '../inbody/InBodyTrendsChart';
import { getImageUrl } from '../../utils/imageUtils';

const CoachClientDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const loadData = async () => {
            try {
                const details = await coachPortalService.getClientDetails(id);
                setData(details);
            } catch (err: any) {
                setError(err.message || 'Failed to load client details');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!data) return null;

    const { profile, measurements, history } = data;

    return (
        <div className="max-w-lg mx-auto pb-20 space-y-6">
            {/* Profile Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-200">
                    {profile.profileImage ? (
                        <img
                            src={getImageUrl(profile.profileImage) || ''}
                            alt={profile.firstName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User size={32} />
                    )}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h1>
                    <div className="text-gray-500">{profile.email}</div>
                    <div className="text-gray-500 text-sm">{profile.phone}</div>
                </div>
            </div>

            {/* InBody Section */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Activity size={20} className="text-blue-600" />
                        InBody Trends
                    </h2>
                    <Link
                        to={`/coach/inbody/new/${id}`}
                        className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Plus size={20} />
                    </Link>
                </div>

                {measurements.length > 0 ? (
                    <div className="w-full">
                        <InBodyTrendsChart data={measurements} />
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
                        No measurements recorded yet.
                    </div>
                )}
            </div>

            {/* Recent Workouts */}
            <div>
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Recent Workouts
                </h2>
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
                            No active history.
                        </div>
                    ) : (
                        history.map((session: any) => (
                            <div key={session.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="text-sm font-bold text-gray-900 mb-1">
                                    {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {session.notes && (
                                    <div className="bg-gray-50 p-2 rounded text-sm text-gray-600 italic">
                                        "{session.notes}"
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoachClientDetails;
