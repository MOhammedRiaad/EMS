import React from 'react';
import { Search, X } from 'lucide-react';
import './FilterBar.css';

interface FilterOption {
    value: string;
    label: string;
}

interface DropdownFilter {
    key: string;
    label: string;
    options: FilterOption[];
}

interface DateRangeFilter {
    fromKey: string;
    toKey: string;
    label: string;
}

interface FilterBarProps {
    searchPlaceholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    dropdowns?: DropdownFilter[];
    dateRange?: DateRangeFilter;
    filters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onClearAll: () => void;
    children?: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({
    searchPlaceholder = 'Search...',
    searchValue,
    onSearchChange,
    dropdowns = [],
    dateRange,
    filters,
    onFilterChange,
    onClearAll,
    children
}) => {
    const hasActiveFilters = () => {
        if (searchValue) return true;
        if (dropdowns.some(d => filters[d.key] && filters[d.key] !== 'all')) return true;
        if (dateRange && (filters[dateRange.fromKey] || filters[dateRange.toKey])) return true;
        return false;
    };

    return (
        <div className="filter-bar">
            {/* Search Input */}
            <div className="filter-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="search-input"
                />
                {searchValue && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="clear-search-btn"
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown Filters */}
            {dropdowns.map((dropdown) => (
                <div key={dropdown.key} className="filter-dropdown">
                    <label className="filter-label">{dropdown.label}</label>
                    <select
                        value={filters[dropdown.key] || 'all'}
                        onChange={(e) => onFilterChange(dropdown.key, e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All {dropdown.label}</option>
                        {dropdown.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            ))}

            {/* Date Range Filter */}
            {dateRange && (
                <div className="filter-date-range">
                    <label className="filter-label">{dateRange.label}</label>
                    <div className="date-inputs">
                        <input
                            type="date"
                            value={filters[dateRange.fromKey] || ''}
                            onChange={(e) => onFilterChange(dateRange.fromKey, e.target.value)}
                            className="date-input"
                            placeholder="From"
                        />
                        <span className="date-separator">to</span>
                        <input
                            type="date"
                            value={filters[dateRange.toKey] || ''}
                            onChange={(e) => onFilterChange(dateRange.toKey, e.target.value)}
                            className="date-input"
                            placeholder="To"
                        />
                    </div>
                </div>
            )}

            {/* Clear All Button */}
            {hasActiveFilters() && (
                <button
                    onClick={onClearAll}
                    className="clear-all-btn"
                >
                    <X size={16} />
                    Clear Filters
                </button>
            )}

            {/* Children (e.g. Action Buttons) */}
            {children}
        </div>
    );
};

export default FilterBar;
