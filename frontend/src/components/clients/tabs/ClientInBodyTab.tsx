import React, { useState, useEffect } from 'react';
import { Scale, Calendar, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '../../../services/api';

interface InBodyScan {
    id: string;
    scanDate: string;
    weight: number;
    bodyFatPercentage: number;
    muscleMass: number;
    bmi: number;
    visceralFat: number;
    notes?: string;
}

interface ClientInBodyTabProps {
    clientId: string;
}

const ClientInBodyTab: React.FC<ClientInBodyTabProps> = ({ clientId }) => {
    const [scans, setScans] = useState<InBodyScan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScans();
    }, [clientId]);

    const loadScans = async () => {
        try {
            setLoading(true);
            const data = await authenticatedFetch(`/inbody?clientId=${clientId}`);
            setScans(data);
        } catch (err) {
            console.error('Failed to load InBody scans:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTrend = (current: number, previous: number | undefined, inverse: boolean = false) => {
        if (previous === undefined) return null;
        const diff = current - previous;
        const isPositive = inverse ? diff < 0 : diff > 0;
        const Icon = diff === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;
        const color = diff === 0 ? 'text-gray-400' : isPositive ? 'text-green-500' : 'text-red-500';
        return <Icon size={14} className={color} />;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (scans.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <Scale className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No InBody Scans</h3>
                <p className="text-gray-500 dark:text-gray-400">This client has no InBody scan records yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Scale size={18} />
                    InBody Scan History ({scans.length} records)
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Body Fat %</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Muscle (kg)</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">BMI</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visceral Fat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {scans.map((scan, index) => {
                            const prev = scans[index + 1];
                            return (
                                <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        {new Date(scan.scanDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                                        <span className="flex items-center justify-end gap-1">
                                            {scan.weight?.toFixed(1)}
                                            {getTrend(scan.weight, prev?.weight)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                                        <span className="flex items-center justify-end gap-1">
                                            {scan.bodyFatPercentage?.toFixed(1)}%
                                            {getTrend(scan.bodyFatPercentage, prev?.bodyFatPercentage, true)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                                        <span className="flex items-center justify-end gap-1">
                                            {scan.muscleMass?.toFixed(1)}
                                            {getTrend(scan.muscleMass, prev?.muscleMass)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                                        {scan.bmi?.toFixed(1)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                                        {scan.visceralFat}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientInBodyTab;
