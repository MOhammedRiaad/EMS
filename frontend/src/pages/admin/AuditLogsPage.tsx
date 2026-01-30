import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import { auditService, type AuditLog } from '../../services/audit.service';
import { format } from 'date-fns';
import { Activity, Search, Calendar, User, Database } from 'lucide-react';

const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await auditService.getAll(200); // Fetch last 200 logs
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: Column<AuditLog>[] = [
        {
            key: 'action',
            header: 'Action',
            render: (log) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={16} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 500 }}>{log.action}</span>
                </div>
            )
        },
        {
            key: 'entityType',
            header: 'Entity',
            render: (log) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span>{log.entityType} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75em' }}>#{log.entityId?.slice(0, 8)}</span></span>
                </div>
            )
        },
        {
            key: 'performedBy',
            header: 'User',
            render: (log) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span>{log.performedBy}</span>
                </div>
            )
        },
        {
            key: 'createdAt',
            header: 'Date',
            render: (log) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span>{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}</span>
                </div>
            )
        },
        {
            key: 'details',
            header: 'Details',
            render: (log) => {
                if (!log.details) return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;

                // Check if it's a diff
                if (log.details.changes) {
                    const changes = Object.keys(log.details.changes).length;
                    return (
                        <div title={JSON.stringify(log.details.changes, null, 2)} style={{ cursor: 'help' }}>
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: '4px',
                                fontSize: '0.85em',
                                border: '1px solid var(--border-color)'
                            }}>
                                {changes} field{changes !== 1 ? 's' : ''} changed
                            </span>
                        </div>
                    );
                }

                return (
                    <div title={JSON.stringify(log.details, null, 2)} style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.85em',
                        color: 'var(--color-text-secondary)',
                        cursor: 'help'
                    }}>
                        {JSON.stringify(log.details)}
                    </div>
                );
            }
        }
    ];

    return (
        <div style={{ padding: '1.5rem' }}>
            <PageHeader
                title="Audit Logs"
                description="Track system activity and changes"
            />

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{
                    position: 'relative',
                    maxWidth: '300px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredLogs}
                isLoading={loading}
                emptyMessage="No audit logs found."
            />
        </div>
    );
};

export default AuditLogsPage;
