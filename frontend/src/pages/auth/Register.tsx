import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Mail, Building2, AlertCircle, ChevronRight, ChevronLeft, Check, X, Loader2, CheckCircle2, Users, Activity, HardDrive } from 'lucide-react';
import { tenantService } from '../../services/tenant.service';
import { authService, type Plan } from '../../services/auth.service';
import '../../styles/variables.css';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    // Step 1: Business Name
    const [businessName, setBusinessName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [checkingSlug, setCheckingSlug] = useState(false);

    // Step 2: Plan Selection
    const [selectedPlanKey, setSelectedPlanKey] = useState<string>('');

    // Step 3: User Details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const availablePlans = await authService.getPlans();
                setPlans(availablePlans);
                // Default to trial if available, or first plan
                const trial = availablePlans.find(p => p.key === 'trial');
                if (trial) setSelectedPlanKey('trial');
                else if (availablePlans.length > 0) setSelectedPlanKey(availablePlans[0].key);
            } catch (err) {
                console.error('Failed to load plans', err);
                // Fallback or show error
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

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
        } else if (step === 2 && selectedPlanKey) {
            setStep(3);
            setError(null);
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
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
                planKey: selectedPlanKey,
            });

            // On success, redirect to login
            navigate('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getPlanFeatureList = (features: string[]) => {
        return features.slice(0, 4); // Limit to top 4 features for card
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
                maxWidth: step === 2 ? '900px' : '500px', // Wider for plans
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2rem',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                transition: 'max-width 0.3s ease'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-primary)'
                    }}>
                        {step === 1 ? 'Setup Your Studio' : step === 2 ? 'Choose Your Plan' : 'Create Your Account'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        {step === 1 ? 'Step 1 of 3: Business Information' : step === 2 ? 'Step 2 of 3: Select a Plan' : 'Step 3 of 3: Owner Account'}
                    </p>
                </div>

                {/* Progress Indicator */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '2rem'
                }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '3rem',
                            height: '4px',
                            borderRadius: '2px',
                            backgroundColor: step >= i ? 'var(--color-primary)' : 'var(--border-color)',
                            transition: 'background-color 0.3s ease'
                        }} />
                    ))}
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
                                    autoFocus
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
                                Next Step
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            {loadingPlans ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    {plans.map(plan => (
                                        <div
                                            key={plan.key}
                                            onClick={() => setSelectedPlanKey(plan.key)}
                                            style={{
                                                border: `2px solid ${selectedPlanKey === plan.key ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                borderRadius: 'var(--border-radius-md)',
                                                padding: '1.5rem',
                                                cursor: 'pointer',
                                                backgroundColor: selectedPlanKey === plan.key ? 'rgba(var(--color-primary-rgb), 0.05)' : 'var(--color-bg-primary)',
                                                transition: 'all 0.2s',
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%'
                                            }}
                                        >
                                            {selectedPlanKey === plan.key && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-10px',
                                                    right: '1rem',
                                                    backgroundColor: 'var(--color-primary)',
                                                    color: 'white',
                                                    borderRadius: '999px',
                                                    padding: '2px 8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600
                                                }}>
                                                    Selected
                                                </div>
                                            )}
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>{plan.name}</h3>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
                                                {plan.price ? `$${plan.price}` : plan.name === 'Enterprise' ? 'Contact Us' : 'Free'}
                                                <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)' }}>/mo</span>
                                            </div>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', flex: 1 }}>
                                                {plan.description}
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {getPlanFeatureList(plan.features).map((feature, idx) => (
                                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <CheckCircle2 size={14} color="var(--color-success)" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div style={{
                                                marginTop: 'auto',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid var(--border-color)',
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '0.75rem',
                                                fontSize: '0.75rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                                                    <Users size={12} style={{ color: 'var(--color-primary)' }} />
                                                    {plan.limits.maxClients === -1 ? 'Unlimited' : plan.limits.maxClients} Clients
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                                                    <Activity size={12} style={{ color: 'var(--color-success)' }} />
                                                    {plan.limits.maxSessionsPerMonth === -1 ? 'Unlimited' : plan.limits.maxSessionsPerMonth} Sessions
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                                                    <User size={12} style={{ color: 'var(--color-accent)' }} />
                                                    {plan.limits.maxCoaches === -1 ? 'Unlimited' : plan.limits.maxCoaches} Coaches
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}>
                                                    <HardDrive size={12} style={{ color: 'var(--color-primary)' }} />
                                                    {plan.limits.storageGB === -1 ? 'Unlimited' : `${plan.limits.storageGB}GB`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

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
                                        gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ChevronLeft size={18} />
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    disabled={!selectedPlanKey}
                                    style={{
                                        flex: 2,
                                        padding: '0.875rem',
                                        backgroundColor: selectedPlanKey ? 'var(--color-primary)' : 'var(--border-color)',
                                        color: 'white',
                                        borderRadius: 'var(--border-radius-md)',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        cursor: selectedPlanKey ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Next Step
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
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
                                            autoFocus
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
                                        gap: '0.5rem',
                                        cursor: 'pointer'
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
                                        opacity: loading ? 0.7 : 1,
                                        cursor: loading ? 'not-allowed' : 'pointer'
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
