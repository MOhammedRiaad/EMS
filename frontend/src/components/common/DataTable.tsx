import React from 'react';
import './Table.css';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    // Selection
    selectionMode?: 'single' | 'multiple';
    selectedItems?: string[];
    onSelectionChange?: (ids: string[]) => void;
    // Pagination
    pagination?: {
        page: number;
        limit: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}

const DataTable = <T extends { id: string | number }>({
    columns,
    data,
    onRowClick,
    isLoading,
    emptyMessage,
    selectionMode,
    selectedItems = [],
    onSelectionChange,
    pagination
}: DataTableProps<T>) => {
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange?.(data.map(item => String(item.id)));
        } else {
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectionMode === 'single') {
            onSelectionChange?.([id]);
        } else {
            const newSelection = selectedItems.includes(id)
                ? selectedItems.filter(item => item !== id)
                : [...selectedItems, id];
            onSelectionChange?.(newSelection);
        }
    };

    if (isLoading) {
        return <div className="table-loading">Loading data...</div>;
    }

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {selectionMode === 'multiple' && (
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={data.length > 0 && selectedItems.length === data.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                        )}
                        {columns.map((col) => (
                            <th key={col.key} style={{ width: col.width }}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (selectionMode ? 1 : 0)} className="table-empty">
                                {emptyMessage || 'No data available'}
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => {
                            const id = String(item.id);
                            const isSelected = selectedItems.includes(id);
                            return (
                                <tr
                                    key={id}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`${onRowClick ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
                                >
                                    {selectionMode && (
                                        <td onClick={(e) => handleSelectRow(id, e)}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td key={`${id}-${col.key}`}>
                                            {col.render ? col.render(item) : (item as any)[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            {pagination && (
                <div className="table-pagination">
                    <div className="pagination-info">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="pagination-controls">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        <span className="page-number">Page {pagination.page} of {totalPages}</span>
                        <button
                            disabled={pagination.page >= totalPages}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
