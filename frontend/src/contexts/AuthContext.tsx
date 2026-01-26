import React, { createContext, useContext, useState } from 'react';

interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: 'tenant_owner' | 'admin' | 'coach' | 'client';
    tenantId: string;
}

interface Tenant {
    id: string;
    name: string;
    isComplete: boolean;
    settings?: {
        branding?: {
            logoUrl?: string;
            primaryColor?: string;
            secondaryColor?: string;
        };
        [key: string]: any;
    };
}

interface AuthContextType {
    user: User | null;
    tenant: Tenant | null;
    token: string | null;
    login: (token: string, user: User, tenant?: Tenant) => void;
    logout: () => void;
    isAuthenticated: boolean;
    needsOnboarding: boolean;
    setTenant: (tenant: Tenant) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [tenant, setTenantState] = useState<Tenant | null>(() => {
        const stored = localStorage.getItem('tenant');
        return stored ? JSON.parse(stored) : null;
    });

    const login = (newToken: string, newUser: User, newTenant?: Tenant) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        if (newTenant) {
            setTenantState(newTenant);
            localStorage.setItem('tenant', JSON.stringify(newTenant));
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setTenantState(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
    };

    const setTenant = (newTenant: Tenant) => {
        setTenantState(newTenant);
        localStorage.setItem('tenant', JSON.stringify(newTenant));
    };

    // Check if tenant owner needs to complete onboarding
    const needsOnboarding = !!user && user.role === 'tenant_owner' && !!tenant && !tenant.isComplete;

    return (
        <AuthContext.Provider value={{
            user,
            tenant,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            needsOnboarding,
            setTenant,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

