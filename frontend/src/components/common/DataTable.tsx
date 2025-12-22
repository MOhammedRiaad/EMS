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
}

const DataTable = <T extends { id: string | number }>({ columns, data, onRowClick, isLoading }: DataTableProps<T>) => {
    if (isLoading) {
        return <div className="table-loading">Loading data...</div>;
    }

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={{ width: col.width }}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="table-empty">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr key={item.id} onClick={() => onRowClick && onRowClick(item)} className={onRowClick ? 'clickable' : ''}>
                                {columns.map((col) => (
                                    <td key={`${item.id}-${col.key}`}>
                                        {col.render ? col.render(item) : (item as any)[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
