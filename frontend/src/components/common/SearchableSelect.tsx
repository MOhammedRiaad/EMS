import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Plus } from 'lucide-react';

export interface SearchableSelectOption {
    label: string;
    value: string;
    description?: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string; // Wrapper class
    triggerClassName?: string; // Trigger button class
    emptyMessage?: string;
    onSearchChange?: (term: string) => void;
    onAddNew?: (searchTerm: string) => void;
    onAddNewLabel?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    disabled = false,
    required = false,
    className = '',
    triggerClassName = '',
    emptyMessage = 'No options found',
    onSearchChange,
    onAddNew,
    onAddNewLabel = 'Add New'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<SearchableSelectOption[]>(options);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        if (onSearchChange) {
            // Server-side filtering: options are already filtered by parent
            setFilteredOptions(options);
            // Trigger search when term changes (debounce handled by parent if needed, 
            // but usually we want to trigger it here. Actually parent handles debounce usually)
            // But wait, if I put onSearchChange here, it runs on every render if I'm not careful.
            // Better to trigger onSearchChange in the input onChange handler.
        } else {
            // Local filtering
            setFilteredOptions(
                options.filter(opt =>
                    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
                )
            );
        }
    }, [searchTerm, options, onSearchChange]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Slight delay to ensure render
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const toggleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchTerm('');
        }
    };

    const handleAddNew = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddNew) {
            onAddNew(searchTerm);
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={toggleOpen}
                className={`
                    w-full min-h-[42px] px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg 
                    flex items-center justify-between cursor-pointer transition-colors
                    ${disabled
                        ? 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                        : isOpen
                            ? 'border-brand-500 ring-1 ring-brand-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                    ${triggerClassName}
                `}
            >
                <div className="flex-1 truncate mr-2">
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white font-medium truncate">
                                {selectedOption.label}
                            </span>
                        </div>
                    ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                            {placeholder}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {value && !disabled && !required && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (onSearchChange) {
                                        onSearchChange(e.target.value);
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                        {filteredOptions.length > 0 ? (
                            <>
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            px-3 py-2 cursor-pointer transition-colors
                                            ${value === option.value
                                                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }
                                        `}
                                    >
                                        <div className="font-medium">{option.label}</div>
                                        {option.description && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {option.description}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {onAddNew && searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleAddNew}
                                        className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 border-t border-gray-100 dark:border-gray-700 transition-colors"
                                    >
                                        <Plus size={16} />
                                        {onAddNewLabel} "{searchTerm}"
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center py-6 px-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                                    {emptyMessage}
                                </div>
                                {onAddNew && searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleAddNew}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                    >
                                        <Plus size={16} />
                                        {onAddNewLabel} "{searchTerm}"
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
