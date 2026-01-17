import { useState, useEffect } from 'react';
import { clientPortalService } from '../../services/client-portal.service';
import { Package, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientProfile = () => {
    // We get "activePackage" from dashboard, but for full profile we might need a new endpoint
    // or just reuse dashboard info + maybe a "history" endpoint later.
    // For now, let's reuse dashboard data to show active package detail.
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        clientPortalService.getDashboard()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-6 text-center text-gray-500">Loading profile...</div>;

    const { activePackage } = data || {};

    return (
        <div className="p-4 space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

            {/* Active Plan */}
            <section>
                <h2 className="font-semibold text-gray-700 mb-2">Active Plan</h2>
                {activePackage ? (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-green-100 text-green-600 px-3 py-1 rounded-bl-xl font-medium text-xs">
                            Active
                        </div>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{activePackage.package?.name}</h3>
                                <p className="text-sm text-gray-500">Expires {new Date(activePackage.expiryDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Sessions Remaining</span>
                                <span className="font-medium text-gray-900">{activePackage.sessionsRemaining} / {activePackage.sessionsUsed + activePackage.sessionsRemaining}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(activePackage.sessionsRemaining / (activePackage.sessionsUsed + activePackage.sessionsRemaining)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
                        <Package className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500 mb-2">No active plan</p>
                        <button className="text-blue-600 font-medium text-sm">Purchase a Plan (Contact Studio)</button>
                    </div>
                )}
            </section>

            {/* Account Info (Static for now) */}
            <section>
                <h2 className="font-semibold text-gray-700 mb-2">Account Details</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium text-gray-900">{/* User email from context? */} user@example.com</span>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-gray-500">Member Since</span>
                        <span className="font-medium text-gray-900">Jan 2024</span>
                    </div>
                </div>
            </section>

            <div className="pt-4">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="w-full bg-gray-100 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default ClientProfile;
