import React from 'react';
import { Calendar, Download } from 'lucide-react';
import type { InBodyScan } from '../../services/inbody.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// StatsCards
// ============================================================================

export interface StatsCardsProps {
    latestScan: InBodyScan;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ latestScan }) => (
    <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-1">Weight</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{latestScan.weight} <span className="text-xs font-normal text-gray-400">kg</span></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-1">Muscle</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{latestScan.skeletalMuscleMass} <span className="text-xs font-normal text-gray-400">kg</span></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-1">Body Fat</div>
            <div className="text-xl font-bold text-orange-500 dark:text-orange-400">{latestScan.bodyFatPercentage} <span className="text-xs font-normal text-gray-400">%</span></div>
        </div>
    </div>
);

// ============================================================================
// ScanHistoryList
// ============================================================================

export interface ScanHistoryListProps {
    scans: InBodyScan[];
}

export const ScanHistoryList: React.FC<ScanHistoryListProps> = ({ scans }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 font-semibold text-gray-800 dark:text-white">
            Scan History
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {scans.map(scan => (
                <div key={scan.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                                {new Date(scan.scanDate).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Weight: {scan.weight}kg · BF: {scan.bodyFatPercentage}%
                            </div>
                        </div>
                    </div>

                    {scan.fileUrl && (
                        <a
                            href={`${API_URL}/storage/${scan.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download Report"
                        >
                            <Download size={20} />
                        </a>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// ============================================================================
// EmptyScansState
// ============================================================================

export const EmptyScansState: React.FC = () => (
    <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 text-center text-gray-500">
        No scan data available yet.
    </div>
);
