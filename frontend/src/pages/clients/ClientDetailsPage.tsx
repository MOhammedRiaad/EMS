import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Wallet, FileText, Phone, Mail } from 'lucide-react';
import FinanceTab from '../../components/clients/tabs/FinanceTab';
import WaiversTab from '../../components/clients/tabs/WaiversTab';

import ClientParqTab from '../../components/clients/tabs/ClientParqTab';
import HealthAndProgressTab from '../../components/clients/tabs/HealthAndProgressTab';
import { Activity, Heart } from 'lucide-react';
import { clientsService } from '../../services/clients.service';
import { api } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';

const ClientDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const res = await api.get(`/clients/${id}`);
                setClient(res.data);
            } catch (error) {
                console.error('Failed to load client', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchClient();
    }, [id]);

    if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
    if (!client) return <div className="p-6 text-center text-red-500">Client not found</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            <div className="flex-shrink-0">
                                {client.avatarUrl ? (
                                    <img src={getImageUrl(client.avatarUrl) ?? undefined} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700" />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <User className="w-16 h-16 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.firstName} {client.lastName}</h1>
                                <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {client.status ? client.status.toUpperCase() : 'UNKNOWN'}
                                </span>
                                <div className="mt-4 space-y-2 text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4" />
                                        <span>{client.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Phone className="w-4 h-4" />
                                        <span>{client.phone || 'No phone'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Personal Info</h3>
                                <dl className="space-y-1">
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Gender</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.gender || '-'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Date of Birth</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : '-'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Joined</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{new Date(client.createdAt).toLocaleDateString()}</dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Contact Info</h3>
                                <dl className="space-y-1">
                                    <div className="py-1">
                                        <dt className="text-gray-600 dark:text-gray-400 text-sm">Address</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.address || '-'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Emergency Contact</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.emergencyContactName || '-'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Emergency Phone</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.emergencyContactPhone || '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                );
            case 'finance':
                return <FinanceTab />;
            case 'waivers':
                return <WaiversTab />;
            case 'parq':
                return <ClientParqTab clientId={id!} />;
            case 'health':
                return <HealthAndProgressTab client={client} onUpdate={async (data) => { await clientsService.update(id!, data); }} />;
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="mb-6">
                <button
                    onClick={() => navigate('/clients')}
                    className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Clients
                </button>
            </div>

            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: User },
                        { id: 'finance', label: 'Finance', icon: Wallet },
                        { id: 'waivers', label: 'Waivers', icon: FileText },
                        { id: 'parq', label: 'PAR-Q', icon: Activity },
                        { id: 'health', label: 'Health & Progress', icon: Heart },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
                            `}
                        >
                            <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ClientDetailsPage;
