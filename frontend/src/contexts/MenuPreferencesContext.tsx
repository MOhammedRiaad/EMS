import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface MenuPreferences {
    expandedSections: Record<string, boolean>;
    pinnedItems: string[];
    sectionOrder: string[];
}

interface MenuPreferencesContextType {
    preferences: MenuPreferences;
    toggleSection: (sectionId: string) => void;
    togglePinItem: (itemPath: string) => void;
    reorderSections: (newOrder: string[]) => void;
    isPinned: (itemPath: string) => boolean;
    isSectionExpanded: (sectionId: string) => boolean;
}

const MenuPreferencesContext = createContext<MenuPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'ems_menu_preferences';

const defaultPreferences: MenuPreferences = {
    expandedSections: {},
    pinnedItems: [],
    sectionOrder: ['core', 'management', 'client-business', 'analytics', 'administration']
};

export const MenuPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [preferences, setPreferences] = useState<MenuPreferences>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return { ...defaultPreferences, ...JSON.parse(stored) };
            } catch {
                return defaultPreferences;
            }
        }
        return defaultPreferences;
    });

    // Save to localStorage whenever preferences change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }, [preferences]);

    const toggleSection = (sectionId: string) => {
        setPreferences(prev => ({
            ...prev,
            expandedSections: {
                ...prev.expandedSections,
                [sectionId]: !prev.expandedSections[sectionId]
            }
        }));
    };

    const togglePinItem = (itemPath: string) => {
        setPreferences(prev => ({
            ...prev,
            pinnedItems: prev.pinnedItems.includes(itemPath)
                ? prev.pinnedItems.filter(p => p !== itemPath)
                : [...prev.pinnedItems, itemPath]
        }));
    };

    const reorderSections = (newOrder: string[]) => {
        setPreferences(prev => ({
            ...prev,
            sectionOrder: newOrder
        }));
    };

    const isPinned = (itemPath: string) => preferences.pinnedItems.includes(itemPath);

    const isSectionExpanded = (sectionId: string) => {
        // Default to true if not set
        return preferences.expandedSections[sectionId] !== false;
    };

    return (
        <MenuPreferencesContext.Provider
            value={{
                preferences,
                toggleSection,
                togglePinItem,
                reorderSections,
                isPinned,
                isSectionExpanded
            }}
        >
            {children}
        </MenuPreferencesContext.Provider>
    );
};

export const useMenuPreferences = () => {
    const context = useContext(MenuPreferencesContext);
    if (!context) {
        throw new Error('useMenuPreferences must be used within MenuPreferencesProvider');
    }
    return context;
};
