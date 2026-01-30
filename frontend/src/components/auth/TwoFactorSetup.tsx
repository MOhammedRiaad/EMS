import React, { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface TwoFactorSetupProps {
    onComplete: () => void;
    onCancel: () => void;
    isEnabled?: boolean;
}

// Sub-component for managing existing 2FA (Disable flow)
const TwoFactorManage: React.FC<{ onDisable: () => Promise<void>; onCancel: () => void }> = ({ onDisable, onCancel }) => {
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDisable = async () => {
        setLoading(true);
        setError(null);
        try {
            await onDisable();
        } catch (err) {
            setError('Failed to disable 2FA');
            setLoading(false);
        }
    };

    if (confirming) {
        return (
            <div className="p-6 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Disable 2FA?</h3>
                <p className="text-gray-500 mb-6 font-medium">Your account will be less secure. Are you sure?</p>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <div className="flex gap-3">
                    <button
                        onClick={() => setConfirming(false)}
                        className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDisable}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Disable
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2FA is Enabled</h3>
            <p className="text-gray-500 mb-6 font-medium">Your account is secured with two-factor authentication.</p>

            <button
                onClick={() => setConfirming(true)}
                className="text-red-500 hover:text-red-600 font-medium text-sm underline underline-offset-4"
            >
                Disable 2FA
            </button>

            <div className="mt-8">
                <button
                    onClick={onCancel}
                    className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel, isEnabled }) => {
    const [step, setStep] = useState<'loading' | 'scan' | 'verify' | 'success'>('loading');
    const [secretData, setSecretData] = useState<{ secret: string; qrCode: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isEnabled) {
            fetchSecret();
        }
    }, [isEnabled]);

    const fetchSecret = async () => {
        setStep('loading');
        try {
            const data = await authService.generateTwoFactor();
            setSecretData(data);
            setStep('scan');
        } catch (err) {
            setError('Failed to generate 2FA secret. Please try again.');
        }
    };

    const handleCopySecret = () => {
        if (secretData?.secret) {
            navigator.clipboard.writeText(secretData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setVerifying(true);

        try {
            await authService.enableTwoFactor(verificationCode);
            setStep('success');
            setTimeout(() => {
                onComplete();
            }, 2000);
        } catch (err) {
            setError('Invalid code. Please try again.');
            setVerifying(false);
        }
    };

    const handleDisable = async () => {
        await authService.disableTwoFactor();
        onComplete(); // Parent should refresh state to show setup view next time
    };

    if (isEnabled) {
        return <TwoFactorManage onDisable={handleDisable} onCancel={onCancel} />;
    }

    if (step === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-500">Generating security keys...</p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2FA Enabled!</h3>
                <p className="text-gray-500 dark:text-gray-400">Your account is now more secure.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <QrCode size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Setup 2-Factor Auth</h2>
                    <p className="text-sm text-gray-500">Protect your account with an extra layer of security.</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Step 1: Scan */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs">1</span>
                        Scan QR Code
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-center">
                        {secretData?.qrCode ? (
                            <img src={secretData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                        ) : (
                            <div className="w-48 h-48 bg-gray-100 animate-pulse rounded" />
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">Can't scan the code?</p>
                        <button
                            onClick={handleCopySecret}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-md text-xs font-mono text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            {secretData?.secret || 'Generating...'}
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                {/* Step 2: Verify */}
                <form onSubmit={handleVerify} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs">2</span>
                        Enter Verification Code
                    </div>
                    <div>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000 000"
                            className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-purple-500 focus:ring-0 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-300"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={verificationCode.length !== 6 || verifying}
                            className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                        >
                            {verifying && <Loader2 size={16} className="animate-spin" />}
                            Verify & Enable
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TwoFactorSetup;
