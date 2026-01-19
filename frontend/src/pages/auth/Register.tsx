import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Mail, Building2, AlertCircle, ChevronRight, ChevronLeft, Check, X, Loader2 } from 'lucide-react';
import { tenantService } from '../../services/tenant.service';
import { authService } from '../../services/auth.service';
import '../../styles/variables.css';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Step 1: Business Name
    const [businessName, setBusinessName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [checkingSlug, setCheckingSlug] = useState(false);

    // Step 2: User Details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const checkSlugAvailability = async (name: string) => {
        if (!name.trim()) {
            setSlugAvailable(null);
            return;
        }

        setCheckingSlug(true);
        try {
            const data = await tenantService.checkSlug(name);
            setSlug(data.slug);
            setSlugAvailable(data.available);
        } catch {
            setSlugAvailable(null);
        } finally {
            setCheckingSlug(false);
        }
    };

    const handleBusinessNameBlur = () => {
        checkSlugAvailability(businessName);
    };

    const handleNextStep = () => {
        if (step === 1 && slugAvailable) {
            setStep(2);
            setError(null);
        }
    };

    const handlePrevStep = () => {
        if (step === 2) {
            setStep(1);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await authService.register({
                businessName: businessName,
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName,
            });

            // On success, redirect to login
            navigate('/login');
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
                maxWidth: '500px',
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
                    }}>
                        {step === 1 ? 'Setup Your Studio' : 'Create Your Account'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        {step === 1 ? 'Step 1 of 2: Business Information' : 'Step 2 of 2: Owner Account'}
                    </p>
                </div>

                {/* Progress Indicator */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        width: '3rem',
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: 'var(--color-primary)'
                    }} />
                    <div style={{
                        width: '3rem',
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: step === 2 ? 'var(--color-primary)' : 'var(--border-color)'
                    }} />
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
                    {step === 1 && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Business Name</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                    <Building2 size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => {
                                        setBusinessName(e.target.value);
                                        setSlugAvailable(null);
                                    }}
                                    onBlur={handleBusinessNameBlur}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 2.75rem',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--color-bg-primary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    placeholder="Your EMS Studio Name"
                                />
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                    {checkingSlug && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {!checkingSlug && slugAvailable === true && <Check size={18} color="var(--color-success)" />}
                                    {!checkingSlug && slugAvailable === false && <X size={18} color="var(--color-danger)" />}
                                </div>
                            </div>
                            {slug && slugAvailable !== null && (
                                <p style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: slugAvailable ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>
                                    {slugAvailable
                                        ? `Your studio URL: ${slug}.emsstudio.com`
                                        : `The name "${businessName}" is already taken. Try a different name.`}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleNextStep}
                                disabled={!slugAvailable}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    marginTop: '1rem',
                                    backgroundColor: slugAvailable ? 'var(--color-primary)' : 'var(--border-color)',
                                    color: 'white',
                                    borderRadius: 'var(--border-radius-md)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    cursor: slugAvailable ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Next
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>First Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
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
                                            placeholder="John"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Last Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
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
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                        <Mail size={18} />
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
                                            outline: 'none'
                                        }}
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
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
                                        placeholder="Create a password (min 6 chars)"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        backgroundColor: 'transparent',
                                        color: 'var(--color-text-secondary)',
                                        borderRadius: 'var(--border-radius-md)',
                                        border: '1px solid var(--border-color)',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <ChevronLeft size={18} />
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 2,
                                        padding: '0.875rem',
                                        backgroundColor: 'var(--color-accent)',
                                        color: 'white',
                                        borderRadius: 'var(--border-radius-md)',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Creating...' : (
                                        <>
                                            <UserPlus size={18} />
                                            Create Account
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
