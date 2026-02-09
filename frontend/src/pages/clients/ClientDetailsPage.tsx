import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Wallet, FileText, Phone, Mail, Building2, DollarSign, StickyNote, Heart, AlertTriangle, Shield, Eye, EyeOff, MessageSquare } from 'lucide-react';
import FinanceTab from '../../components/clients/tabs/FinanceTab';
import WaiversTab from '../../components/clients/tabs/WaiversTab';

import ClientParqTab from '../../components/clients/tabs/ClientParqTab';
import HealthAndProgressTab from '../../components/clients/tabs/HealthAndProgressTab';
import ClientSessionsTab from '../../components/clients/tabs/ClientSessionsTab';
import ClientInBodyTab from '../../components/clients/tabs/ClientInBodyTab';
import ClientReviewsTab from '../../components/clients/tabs/ClientReviewsTab';
import WhatsAppMessageModal from '../../components/clients/WhatsAppMessageModal';
import { Activity, Heart as HeartIcon, Calendar, Scale, Star } from 'lucide-react';
import { clientsService } from '../../services/clients.service';
import { api } from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';

const ClientDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isEnabled } = useAuth();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

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

    const formatGender = (gender: string | undefined | null): string => {
        if (!gender) return '-';
        const genderMap: Record<string, string> = {
            'male': 'Male',
            'female': 'Female',
            'other': 'Other',
            'prefer_not_to_say': 'Prefer not to say'
        };
        return genderMap[gender] || gender.charAt(0).toUpperCase() + gender.slice(1);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex flex-col md:flex-row gap-6">
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
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.firstName} {client.lastName}</h1>
                                            <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : client.status === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                                {client.status ? client.status.toUpperCase() : 'UNKNOWN'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2 text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center space-x-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{client.email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-4 h-4" />
                                            <span>{client.phone || 'No phone'}</span>
                                            {client.phone && isEnabled('core.whatsapp') && (
                                                <button
                                                    onClick={() => setIsWhatsAppModalOpen(true)}
                                                    className="ml-2 p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                                                    title="Send WhatsApp Message"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {client.studio && (
                                            <div className="flex items-center space-x-2">
                                                <Building2 className="w-4 h-4" />
                                                <span>{client.studio.name}</span>
                                            </div>
                                        )}
                                        {client.userId && (
                                            <div className="flex items-center space-x-2">
                                                <Shield className="w-4 h-4 text-green-500" />
                                                <span className="text-green-600 dark:text-green-400">Has User Account</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Personal Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    Personal Info
                                </h3>
                                <dl className="space-y-3">
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Gender</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">
                                            {formatGender(client.user?.gender)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Date of Birth</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : '-'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Joined</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{new Date(client.createdAt).toLocaleDateString()}</dd>
                                    </div>
                                    {client.updatedAt && (
                                        <div className="flex justify-between py-1">
                                            <dt className="text-gray-600 dark:text-gray-400">Last Updated</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">{new Date(client.updatedAt).toLocaleDateString()}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Contact Info
                                </h3>
                                <dl className="space-y-3">
                                    {client.address && (
                                        <div className="py-1">
                                            <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">Address</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">{client.address}</dd>
                                        </div>
                                    )}
                                    {client.city && (
                                        <div className="py-1">
                                            <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">City</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">{client.city}</dd>
                                        </div>
                                    )}
                                    {client.state && (
                                        <div className="py-1">
                                            <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">State</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">{client.state}</dd>
                                        </div>
                                    )}
                                    {client.zipCode && (
                                        <div className="py-1">
                                            <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">Zip Code</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">{client.zipCode}</dd>
                                        </div>
                                    )}
                                    {client.country && (
                                        <div className="py-1">
                                            <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">Country</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">{client.country}</dd>
                                        </div>
                                    )}
                                    {(!client.address && !client.city && !client.state && !client.zipCode && !client.country) && (
                                        <div className="text-gray-500 dark:text-gray-400 text-sm">No address information</div>
                                    )}
                                </dl>
                            </div>

                            {/* Emergency Contact */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Emergency Contact
                                </h3>
                                <dl className="space-y-3">
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Name</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.emergencyContactName || '-'}</dd>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <dt className="text-gray-600 dark:text-gray-400">Phone</dt>
                                        <dd className="font-medium text-gray-900 dark:text-gray-100">{client.emergencyContactPhone || '-'}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Financial Info */}
                            {isEnabled('finance.client_wallet') && client.creditBalance !== undefined && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Financial
                                    </h3>
                                    <dl className="space-y-3">
                                        <div className="flex justify-between py-1">
                                            <dt className="text-gray-600 dark:text-gray-400">Credit Balance</dt>
                                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                ${typeof client.creditBalance === 'number' ? client.creditBalance.toFixed(2) : '0.00'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            )}

                            {/* Notes */}
                            {(client.notes || client.healthNotes) && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <StickyNote className="w-4 h-4 mr-2" />
                                        Notes
                                    </h3>
                                    <div className="space-y-3">
                                        {client.notes && (
                                            <div>
                                                <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">General Notes</dt>
                                                <dd className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap">{client.notes}</dd>
                                            </div>
                                        )}
                                        {client.healthNotes && (
                                            <div>
                                                <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">Health Notes</dt>
                                                <dd className="font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-pre-wrap">{client.healthNotes}</dd>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Health Goals */}
                            {client.healthGoals && client.healthGoals.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <HeartIcon className="w-4 h-4 mr-2" />
                                        Health Goals
                                    </h3>
                                    <div className="space-y-2">
                                        {client.healthGoals.map((goal: any) => (
                                            <div key={goal.id} className="flex items-start justify-between py-1">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{goal.goal}</div>
                                                    {goal.targetDate && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`ml-2 px-2 py-1 text-xs rounded ${goal.completed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                                    {goal.completed ? 'Completed' : 'Active'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Medical History */}
                            {client.medicalHistory && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <Heart className="w-4 h-4 mr-2" />
                                        Medical History
                                    </h3>
                                    <div className="space-y-3">
                                        {client.medicalHistory.allergies && client.medicalHistory.allergies.length > 0 && (
                                            <div>
                                                <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">Allergies</dt>
                                                <dd className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                    {client.medicalHistory.allergies.join(', ')}
                                                </dd>
                                            </div>
                                        )}
                                        {client.medicalHistory.injuries && client.medicalHistory.injuries.length > 0 && (
                                            <div>
                                                <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">Injuries</dt>
                                                <dd className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                    {client.medicalHistory.injuries.join(', ')}
                                                </dd>
                                            </div>
                                        )}
                                        {client.medicalHistory.conditions && client.medicalHistory.conditions.length > 0 && (
                                            <div>
                                                <dt className="text-gray-600 dark:text-gray-400 text-sm mb-1">Conditions</dt>
                                                <dd className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                    {client.medicalHistory.conditions.join(', ')}
                                                </dd>
                                            </div>
                                        )}
                                        {(!client.medicalHistory.allergies?.length && !client.medicalHistory.injuries?.length && !client.medicalHistory.conditions?.length) && (
                                            <div className="text-gray-500 dark:text-gray-400 text-sm">No medical history recorded</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Privacy & Consent */}
                            {(client.consentFlags || client.privacyPreferences) && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <Shield className="w-4 h-4 mr-2" />
                                        Privacy & Consent
                                    </h3>
                                    <dl className="space-y-3">
                                        {client.consentFlags && (
                                            <>
                                                <div className="flex justify-between py-1">
                                                    <dt className="text-gray-600 dark:text-gray-400">Marketing</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                        {client.consentFlags.marketing ? (
                                                            <span className="text-green-600 dark:text-green-400">✓ Enabled</span>
                                                        ) : (
                                                            <span className="text-gray-400">Disabled</span>
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between py-1">
                                                    <dt className="text-gray-600 dark:text-gray-400">Data Processing</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                        {client.consentFlags.data_processing ? (
                                                            <span className="text-green-600 dark:text-green-400">✓ Enabled</span>
                                                        ) : (
                                                            <span className="text-gray-400">Disabled</span>
                                                        )}
                                                    </dd>
                                                </div>
                                            </>
                                        )}
                                        {client.privacyPreferences && (
                                            <>
                                                <div className="flex justify-between py-1">
                                                    <dt className="text-gray-600 dark:text-gray-400">Leaderboard</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                        {client.privacyPreferences.leaderboard_visible ? (
                                                            <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between py-1">
                                                    <dt className="text-gray-600 dark:text-gray-400">Activity Feed</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                                                        {client.privacyPreferences.activity_feed_visible ? (
                                                            <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </dd>
                                                </div>
                                            </>
                                        )}
                                    </dl>
                                </div>
                            )}
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
            case 'sessions':
                return <ClientSessionsTab clientId={id!} />;
            case 'inbody':
                return <ClientInBodyTab clientId={id!} />;
            case 'reviews':
                return <ClientReviewsTab clientId={id!} />;
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
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: User, text: 'Overview' },
                        { id: 'finance', label: 'Finance', icon: Wallet, feature: 'finance.client_wallet' },
                        { id: 'waivers', label: 'Waivers', icon: FileText, feature: 'compliance.waivers' },
                        { id: 'parq', label: 'PAR-Q', icon: Activity, feature: 'compliance.parq' },
                        { id: 'health', label: 'Health & Progress', icon: Heart, feature: 'client.progress_tracking' },
                        { id: 'sessions', label: 'Sessions', icon: Calendar, feature: 'core.sessions' },
                        { id: 'inbody', label: 'InBody', icon: Scale, feature: 'client.inbody_scans' },
                        { id: 'reviews', label: 'Reviews', icon: Star, feature: 'client.reviews' },
                    ]
                        .filter(tab => !tab.feature || isEnabled(tab.feature))
                        .map((tab) => (
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

            {client && (
                <WhatsAppMessageModal
                    isOpen={isWhatsAppModalOpen}
                    onClose={() => setIsWhatsAppModalOpen(false)}
                    clientName={`${client.firstName} ${client.lastName}`}
                    phoneNumber={client.phone}
                />
            )}
        </div>
    );
};

export default ClientDetailsPage;
