import React from 'react';
import { Clock, User, MapPin, ArrowRight, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface RescheduleConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    sessionData: {
        clientName: string;
        oldDate: Date;
        newDate: Date;
        oldCoachName: string;
        newCoachName: string;
        oldRoomName: string;
        newRoomName: string;
    } | null;
    isUpdating: boolean;
}

const RescheduleConfirmModal: React.FC<RescheduleConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    sessionData,
    isUpdating
}) => {
    if (!isOpen || !sessionData) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-gray-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Confirm Reschedule
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isUpdating}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Are you sure you want to reschedule <strong className="text-gray-900 dark:text-white">{sessionData.clientName}</strong>?
                    </p>

                    <div className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-lg space-y-4 border border-gray-200 dark:border-slate-700">
                        {/* Time Change */}
                        <div className="flex items-center gap-3">
                            <Clock className="text-blue-500 shrink-0" size={18} />
                            <div className="flex-1 grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {format(sessionData.oldDate, 'h:mm a')}
                                </span>
                                <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {format(sessionData.newDate, 'h:mm a')}
                                </span>
                            </div>
                        </div>

                        {/* Coach Change */}
                        <div className="flex items-center gap-3">
                            <User className="text-purple-500 shrink-0" size={18} />
                            <div className="flex-1 grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {sessionData.oldCoachName}
                                </span>
                                <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />
                                <span className={`font-semibold ${sessionData.oldCoachName !== sessionData.newCoachName ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                                    {sessionData.newCoachName}
                                </span>
                            </div>
                        </div>

                        {/* Room Change */}
                        <div className="flex items-center gap-3">
                            <MapPin className="text-orange-500 shrink-0" size={18} />
                            <div className="flex-1 grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {sessionData.oldRoomName}
                                </span>
                                <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />
                                <span className={`font-semibold ${sessionData.oldRoomName !== sessionData.newRoomName ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                                    {sessionData.newRoomName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
                    <button
                        onClick={onClose}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isUpdating && <Loader2 size={14} className="animate-spin" />}
                        Confirm Reschedule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RescheduleConfirmModal;
