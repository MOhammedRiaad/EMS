import React, { useState, useRef } from 'react';
import { parqService } from '../../services/parq.service';
import SignaturePad, { type SignaturePadRef } from '../compliance/SignaturePad';
import { AlertCircle, Check, Activity } from 'lucide-react';

interface ParqModalProps {
    clientId: string;
    onCompleted: () => void;
    onClose: () => void;
}

const QUESTIONS = [
    { id: 'q1', text: "Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?" },
    { id: 'q2', text: "Do you feel pain in your chest when you do physical activity?" },
    { id: 'q3', text: "In the past month, have you had chest pain when you were not doing physical activity?" },
    { id: 'q4', text: "Do you lose your balance because of dizziness or do you ever lose consciousness?" },
    { id: 'q5', text: "Do you have a bone or joint problem that could be made worse by a change in your physical activity?" },
    { id: 'q6', text: "Is your doctor currently prescribing drugs (for example, water pills) for your blood pressure or heart condition?" },
    { id: 'q7', text: "Do you know of any other reason why you should not do physical activity?" }
];

const ParqModal: React.FC<ParqModalProps> = ({ clientId, onCompleted, onClose }) => {
    const [responses, setResponses] = useState<Record<string, boolean>>({});
    const [signing, setSigning] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const sigPadRef = useRef<SignaturePadRef>(null);

    const hasRisk = Object.values(responses).some(val => val === true);

    const handleToggle = (id: string, value: boolean) => {
        setResponses(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSign = async () => {
        if (!sigPadRef.current) return;

        if (isEmpty) {
            alert('Please sign before submitting.');
            return;
        }

        // Verify all questions answered
        if (Object.keys(responses).length < QUESTIONS.length) {
            alert('Please answer all questions.');
            return;
        }

        setSigning(true);
        try {
            const signatureData = sigPadRef.current.toDataURL();
            if (!signatureData) throw new Error('Failed to capture signature');

            await parqService.create({
                clientId,
                responses,
                signatureData
            });
            onCompleted();
        } catch (err: any) {
            alert(err.message || 'Failed to submit PAR-Q');
            setSigning(false);
        }
    };

    const handleClear = () => {
        sigPadRef.current?.clear();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                        <Activity size={24} />
                        <h2 className="text-xl font-bold">Physical Activity Readiness Questionnaire (PAR-Q)</h2>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Please answer the following questions honestly for your safety.
                    </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-950 space-y-6">
                    <div className="space-y-4">
                        {QUESTIONS.map((q) => (
                            <div key={q.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{q.text}</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleToggle(q.id, true)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${responses[q.id] === true
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400'
                                            }`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => handleToggle(q.id, false)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${responses[q.id] === false
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400'
                                            }`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasRisk && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                            <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Physician Clearance Required</h4>
                                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                                    You answered "Yes" to one or more questions. You must consult with your doctor before engaging in physical activity.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Signature */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Create your signature:
                        </label>
                        <SignaturePad ref={sigPadRef} onChange={setIsEmpty} />
                        <div className="flex justify-between items-center text-xs">
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClear}
                                className="text-blue-600 hover:underline"
                            >
                                Clear Signature
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSign}
                        disabled={signing || isEmpty || Object.keys(responses).length < QUESTIONS.length}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {signing ? 'Submitting...' : (
                            <>
                                <Check size={20} />
                                Returns & Submit
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParqModal;
