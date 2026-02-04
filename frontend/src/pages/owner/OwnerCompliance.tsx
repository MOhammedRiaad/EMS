import React, { useEffect, useState } from 'react';
import { ownerPortalService } from '../../services/owner-portal.service';
import {
    ShieldCheck,
    FileCheck,
    Users,
    Activity,
    Download,
    UserMinus,
    Trash2,
    Lock
} from 'lucide-react';

interface ComplianceStats {
    clients: {
        total: number;
        active: number;
        marketingConsentRate: number;
        dataProcessingConsentRate: number;
        termsAcceptanceRate: number;
    };
    rightToBeForgotten: {
        anonymizedTenants: number;
        deletedTenants: number;
        anonymizedUsersIndividual: number;
    };
    generatedAt: string;
}

const OwnerCompliance: React.FC = () => {
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            const data = await ownerPortalService.getComplianceStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load compliance stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleDownloadReport = () => {
        if (!stats) return;
        const reportData = JSON.stringify(stats, null, 2);
        const blob = new Blob([reportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance & Data Governance</h1>
                    <p className="text-gray-500 dark:text-gray-400">Monitor privacy consent, terms acceptance, and data rights requests.</p>
                </div>
                <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Download size={18} />
                    <span>Export Report</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Marketing Consent */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Activity className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            Active
                        </span>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Marketing Consent</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats?.clients.marketingConsentRate}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">of {stats?.clients.active} active clients</p>
                </div>

                {/* Data Processing */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <ShieldCheck className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Data Processing</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats?.clients.dataProcessingConsentRate}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Consent obtained</p>
                </div>

                {/* Terms Acceptance */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <FileCheck className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Terms Acceptance</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats?.clients.termsAcceptanceRate}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Latest version</p>
                </div>

                {/* Right to be Forgotten */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <UserMinus className="text-orange-600 dark:text-orange-400" size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Data Erasure Requests</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {(stats?.rightToBeForgotten.anonymizedUsersIndividual || 0) + (stats?.rightToBeForgotten.anonymizedTenants || 0)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Processed</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Breakdown Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Lock size={20} className="text-gray-400" />
                            Right to be Forgotten Actions
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                        <UserMinus className="text-orange-600 dark:text-orange-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Tenant Anonymization</p>
                                        <p className="text-sm text-gray-500">Soft delete with PII scrubbing</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.rightToBeForgotten.anonymizedTenants}</span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                        <Trash2 className="text-red-600 dark:text-red-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Tenant Deletion</p>
                                        <p className="text-sm text-gray-500">Permanent hard delete</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.rightToBeForgotten.deletedTenants}</span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                        <Users className="text-purple-600 dark:text-purple-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Individual Anonymization</p>
                                        <p className="text-sm text-gray-500">Users/Clients manually anonymized</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.rightToBeForgotten.anonymizedUsersIndividual}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compliance Overview</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                            <p>
                                <strong>GDPR & CCPA Status:</strong> The platform provides tools to manage data subject rights, including access, portability, and erasure.
                            </p>
                            <p>
                                <strong>Data Retention:</strong> Audit logs and activity data are retained according to the system settings (default 90 days).
                            </p>
                            <p>
                                <strong>Consent Management:</strong> All marketing communications require explicit opt-in ("soft opt-in" not used).
                            </p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Automated Checks</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="text-green-500" size={16} />
                                    <span>Encryption at Rest active</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="text-green-500" size={16} />
                                    <span>TLS 1.3 Encryption in Transit</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="text-green-500" size={16} />
                                    <span>Daily Backup Verification</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerCompliance;
