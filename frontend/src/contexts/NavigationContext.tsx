import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { NAVIGATION_ITEMS } from '../config/navigation';
import type { NavItem, NavSection } from '../config/navigation';

interface NavigationContextType {
    items: NavItem[];
    sections: Record<NavSection, NavItem[]>;
    getSectionItems: (section: NavSection) => NavItem[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isEnabled } = useAuth();

    const filteredItems = useMemo(() => {
        if (!user) return [];

        const isAdminOrOwner = ['tenant_owner', 'admin'].includes(user.role);

        return NAVIGATION_ITEMS.filter(item => {
            // 1. Check Role Requirement (adminOnly shorthand)
            if (item.adminOnly && !isAdminOrOwner) {
                return false;
            }

            // 2. Check Role Requirement (explicit)
            if (item.requiredRole && !item.requiredRole.includes(user.role)) {
                return false;
            }

            // 3. Check Feature Requirement
            if (item.requiredFeature && !isEnabled(item.requiredFeature)) {
                return false;
            }

            // 4. Check Permission Requirement (placeholder for now, can implement user.permissions check)
            if (item.requiredPermission && user.permissions) {
                // Simple exact match for now, can be enhanced
                if (!user.permissions.includes(item.requiredPermission)) {
                    return false;
                }
            }

            return true;
        });
    }, [user, isEnabled]);

    const sections = useMemo(() => {
        const result: Partial<Record<NavSection, NavItem[]>> = {};
        const allSections: NavSection[] = ['core', 'management', 'client-business', 'retail', 'marketing', 'analytics', 'administration', 'client-portal', 'coach-portal'];

        allSections.forEach(section => {
            result[section] = filteredItems.filter(item => item.section === section);
        });

        return result as Record<NavSection, NavItem[]>;
    }, [filteredItems]);

    const getSectionItems = (section: NavSection) => sections[section] || [];

    return (
        <NavigationContext.Provider value={{ items: filteredItems, sections, getSectionItems }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
