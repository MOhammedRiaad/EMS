import React, { useState } from 'react';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface TwoFactorVerifyProps {
    userId: string;
    onSuccess: (data: any) => void;
    onCancel: () => void;
}

const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({ userId, onSuccess, onCancel }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setVerifying(true);

        try {
            const data = await authService.verifyTwoFactor(userId, code);
            onSuccess(data);
        } catch (err) {
            setError('Invalid authentication code.');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800 p-8 animate-fade-in-up">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h1>
                <p className="text-gray-500 dark:text-gray-400">Enter the code from your authenticator app.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000 000"
                        className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 focus:border-purple-500 focus:ring-0 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-300"
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="text-center text-sm text-red-500 font-medium animate-shake">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={code.length !== 6 || verifying}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                >
                    {verifying ? <Loader2 size={20} className="animate-spin" /> : <>Verify <ArrowRight size={20} /></>}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    Back to Login
                </button>
            </form>
        </div>
    );
};

export default TwoFactorVerify;
