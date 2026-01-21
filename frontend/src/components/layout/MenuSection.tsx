import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, Pin, PinOff, type LucideIcon } from 'lucide-react';
import { useMenuPreferences } from '../../contexts/MenuPreferencesContext';
import './MenuSection.css';

export interface MenuItem {
    path: string;
    label: string;
    icon: LucideIcon;
}

interface MenuSectionProps {
    id: string;
    title: string;
    items: MenuItem[];
    defaultExpanded?: boolean;
    collapsible?: boolean;
    onPinItem?: (itemPath: string) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
    id,
    title,
    items,
    // defaultExpanded is part of the interface but handled internally via context
    collapsible = true,
    onPinItem
}) => {
    const { isSectionExpanded, toggleSection, isPinned, togglePinItem } = useMenuPreferences();
    const [showPinButtons, setShowPinButtons] = useState(false);
    const isExpanded = isSectionExpanded(id);

    const toggleExpanded = () => {
        if (collapsible) {
            toggleSection(id);
        }
    };

    const handlePinClick = (e: React.MouseEvent, itemPath: string) => {
        e.preventDefault();
        e.stopPropagation();
        togglePinItem(itemPath);
        onPinItem?.(itemPath);
    };

    return (
        <div
            className="menu-section"
            onMouseEnter={() => setShowPinButtons(true)}
            onMouseLeave={() => setShowPinButtons(false)}
        >
            {title && (
                <div
                    className={`menu-section-header ${collapsible ? 'collapsible' : ''}`}
                    onClick={toggleExpanded}
                    style={{ cursor: collapsible ? 'pointer' : 'default' }}
                >
                    <span className="menu-section-title">{title}</span>
                    {collapsible && (
                        isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                </div>
            )}
            {isExpanded && (
                <div className="menu-section-items">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const pinned = isPinned(item.path);

                        return (
                            <div key={item.path} className="menu-item-wrapper">
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${pinned ? 'pinned' : ''}`}
                                >
                                    <Icon className="nav-icon" size={18} />
                                    <span>{item.label}</span>
                                </NavLink>
                                {showPinButtons && (
                                    <button
                                        className="pin-button"
                                        onClick={(e) => handlePinClick(e, item.path)}
                                        title={pinned ? 'Unpin' : 'Pin'}
                                    >
                                        {pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MenuSection;
