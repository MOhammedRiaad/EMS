import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { MenuItem } from './MenuSection';
import './MenuSearch.css';

interface MenuSearchProps {
    allItems: MenuItem[];
    onNavigate: (path: string) => void;
    isCollapsed?: boolean;
}

export const MenuSearch: React.FC<MenuSearchProps> = ({ allItems, onNavigate, isCollapsed }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Open search with Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Filter items based on query
    useEffect(() => {
        if (!query.trim()) {
            setFilteredItems([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = allItems.filter(item =>
            item.label.toLowerCase().includes(lowerQuery) ||
            item.path.toLowerCase().includes(lowerQuery)
        );
        setFilteredItems(filtered);
        setSelectedIndex(0);
    }, [query, allItems]);

    // Handle keyboard navigation in results
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex].path);
        }
    };

    const handleSelect = (path: string) => {
        onNavigate(path);
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) {
        if (isCollapsed) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <button
                        className="menu-search-trigger collapsed"
                        onClick={() => setIsOpen(true)}
                        title="Search (Ctrl+K)"
                    >
                        <Search size={20} />
                    </button>
                </div>
            );
        }

        return (
            <button className="menu-search-trigger" onClick={() => setIsOpen(true)}>
                <Search size={16} />
                <span>Search menu</span>
                <kbd>Ctrl+K</kbd>
            </button>
        );
    }

    return (
        <div className="menu-search-overlay" onClick={() => setIsOpen(false)}>
            <div className="menu-search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="menu-search-input-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="menu-search-input"
                    />
                    <button className="menu-search-close" onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {filteredItems.length > 0 && (
                    <div className="menu-search-results">
                        {filteredItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.path}
                                    className={`menu-search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                                    onClick={() => handleSelect(item.path)}
                                >
                                    <Icon size={16} />
                                    <span>{item.label}</span>
                                    <span className="menu-search-path">{item.path}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {query && filteredItems.length === 0 && (
                    <div className="menu-search-no-results">
                        No results found for "{query}"
                    </div>
                )}
            </div>
        </div>
    );
};
