import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/variables.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Login failed');
            }

            const data = await response.json();
            login(data.accessToken, data.user, data.tenant);

            // Check if tenant owner needs to complete onboarding
            if (data.user.role === 'tenant_owner' && data.tenant && !data.tenant.isComplete) {
                navigate('/onboarding');
            } else if (data.user.role === 'client') {
                navigate('/client/home');
            }
            else if (data.user.role === 'coach') {
                navigate('/coach/home');
            }
            else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg-primary)',
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2rem',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-primary)'
                    }}>Welcome Back</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Sign in to EMS Studio</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-danger)',
                        color: 'var(--color-danger)',
                        padding: '0.75rem',
                        borderRadius: 'var(--border-radius-md)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--color-text-secondary)'
                        }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)'
                            }}>
                                <User size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--color-text-secondary)'
                        }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)'
                            }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--border-radius-md)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '0.5rem'
                        }}
                    >
                        {loading ? 'Signing in...' : (
                            <>
                                <LogIn size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
