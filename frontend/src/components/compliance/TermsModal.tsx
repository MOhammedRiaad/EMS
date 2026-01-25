import React, { useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { termsService, type TermsOfService } from '../../services/terms.service';

interface TermsModalProps {
    terms: TermsOfService;
    onAccepted: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ terms, onAccepted }) => {
    const [accepting, setAccepting] = useState(false);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            await termsService.accept(terms.id);
            onAccepted();
        } catch (err) {
            console.error('Failed to accept terms', err);
            alert('Failed to accept terms. Please try again.');
            setAccepting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                        <ShieldCheck size={24} />
                        <h2 className="text-xl font-bold">Terms of Service Update</h2>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Please review and accept existing terms to continue using the application.
                        <span className="ml-2 font-mono text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                            v{terms.version}
                        </span>
                    </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-950">
                    <div
                        className="prose dark:prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: terms.content }}
                    />
                </div>

                {/* Footer */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {accepting ? 'Accepting...' : (
                            <>
                                <Check size={20} />
                                I Agree & Continue
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        By clicking "I Agree & Continue", you acknowledge that you have read and understood the Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
