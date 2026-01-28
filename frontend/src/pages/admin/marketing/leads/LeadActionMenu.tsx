import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react';
import { type Lead } from '../../../../services/lead.service';

interface LeadActionMenuProps {
    lead: Lead;
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
    onConvert: (lead: Lead) => void;
    vertical?: boolean;
}

const LeadActionMenu: React.FC<LeadActionMenuProps> = ({ lead, onEdit, onDelete, onConvert, vertical = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 ${isOpen ? 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700' : ''}`}
            >
                {vertical ? <MoreVertical size={16} /> : <MoreHorizontal size={18} />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(lead);
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                        <Edit size={14} /> Edit Lead
                    </button>

                    {lead.status !== 'converted' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onConvert(lead);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                            <UserPlus size={14} /> Convert to Client
                        </button>
                    )}

                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(lead);
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default LeadActionMenu;
