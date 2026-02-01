import React, { useState, useEffect, useRef } from 'react';
import { waiverService, type Waiver } from '../../services/waiver.service';
import SignaturePad, { type SignaturePadRef } from './SignaturePad';
import { AlertCircle, Check } from 'lucide-react';

interface WaiverModalProps {
    onSigned: () => void;
}

const WaiverModal: React.FC<WaiverModalProps> = ({ onSigned }) => {
    const [waiver, setWaiver] = useState<Waiver | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [signing, setSigning] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const sigPadRef = useRef<SignaturePadRef>(null);

    useEffect(() => {
        loadWaiver();
    }, []);

    const loadWaiver = async () => {
        try {
            const data = await waiverService.getLatestWaiver();
            setWaiver(data);
        } catch (err: any) {
            console.error('Failed to load waiver', err);
            setError(err.message || 'Failed to load waiver');
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async () => {
        if (!waiver || !sigPadRef.current) return;

        if (isEmpty) {
            alert('Please sign before submitting.');
            return;
        }

        setSigning(true);
        try {
            const signatureData = sigPadRef.current.toDataURL();
            if (!signatureData) throw new Error('Failed to capture signature');

            await waiverService.signWaiver(waiver.id, signatureData);
            onSigned();
        } catch (err: any) {
            alert(err.message || 'Failed to submit signature');
            setSigning(false);
        }
    };

    const handleClear = () => {
        sigPadRef.current?.clear();
    };

    if (loading) return null; // Or a loading spinner overlay
    if (!waiver) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle size={24} />
                        <h2 className="text-xl font-bold">Action Required: Liability Waiver</h2>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        You must read and sign the following waiver to access your account.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-950">
                    <div
                        className="prose dark:prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: waiver.content }}
                    />
                </div>

                {/* Footer / Signature */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Please sign below:
                        </label>
                        <SignaturePad ref={sigPadRef} onChange={setIsEmpty} />
                        <div className="flex justify-end">
                            <button
                                onClick={handleClear}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Clear Signature
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSign}
                        disabled={signing || isEmpty}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {signing ? 'Submitting...' : (
                            <>
                                <Check size={20} />
                                I Agree & Sign
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaiverModal;
