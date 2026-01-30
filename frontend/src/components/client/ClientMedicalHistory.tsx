import React from 'react';
import { ShieldAlert, AlertTriangle, Activity, HeartPulse, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface MedicalHistory {
    allergies: string[];
    injuries: string[];
    conditions: string[];
    custom?: any;
}

interface ClientMedicalHistoryProps {
    history?: MedicalHistory;
    notes?: string;
}

const ClientMedicalHistory: React.FC<ClientMedicalHistoryProps> = ({ history, notes }) => {
    if (!history && !notes) return null;

    const hasData = (history?.allergies?.length || 0) + (history?.injuries?.length || 0) + (history?.conditions?.length || 0) > 0 || !!notes;

    if (!hasData) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-4">
                        <HeartPulse className="text-slate-400" size={24} />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">No Medical History</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        No medical conditions or injuries have been recorded for this client.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Allergies */}
                <Card className="border-l-4 border-l-orange-500 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4 bg-orange-50/50 dark:bg-orange-950/10">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 flex items-center gap-2">
                            <ShieldAlert size={16} />
                            Allergies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 bg-white dark:bg-slate-950">
                        {(history?.allergies?.length || 0) > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {history!.allergies.map((item, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs font-semibold rounded-md border border-orange-200 dark:border-orange-800/50">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400 italic">None recorded</span>
                        )}
                    </CardContent>
                </Card>

                {/* Injuries */}
                <Card className="border-l-4 border-l-red-500 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4 bg-red-50/50 dark:bg-red-950/10">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-2">
                            <Activity size={16} />
                            Injuries
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 bg-white dark:bg-slate-950">
                        {(history?.injuries?.length || 0) > 0 ? (
                            <ul className="space-y-2">
                                {history!.injuries.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-sm text-slate-400 italic">None recorded</span>
                        )}
                    </CardContent>
                </Card>

                {/* Conditions */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden md:col-span-2">
                    <CardHeader className="pb-2 pt-4 px-4 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Medical Conditions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 bg-white dark:bg-slate-950">
                        {(history?.conditions?.length || 0) > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {history!.conditions.map((item, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-md border border-blue-200 dark:border-blue-800/50">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-slate-400 italic">None recorded</span>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            {notes && (
                <Card className="shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <FileText size={16} />
                            Additional Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {notes}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ClientMedicalHistory;
