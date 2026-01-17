import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ActionButtons from '../../components/common/ActionButtons';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { inbodyService, type InBodyScan, type ProgressData } from '../../services/inbody.service';
import { clientsService, type Client } from '../../services/clients.service';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import InBodyTrendsChart from './InBodyTrendsChart';

const InBodyScans: React.FC = () => {
    const navigate = useNavigate();
    const { canEdit, canDelete } = usePermissions();
    const [scans, setScans] = useState<InBodyScan[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedScan, setSelectedScan] = useState<InBodyScan | null>(null);
    const [progressData, setProgressData] = useState<ProgressData | null>(null);
    const [saving, setSaving] = useState(false);



    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            fetchScans();
        }
    }, [selectedClient]);

    const fetchClients = async () => {
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        }
    };

    const fetchScans = async () => {
        setLoading(true);
        try {
            const data = await inbodyService.getByClient(selectedClient);
            setScans(data);
        } catch (error) {
            console.error('Failed to fetch scans', error);
        } finally {
            setLoading(false);
        }
    };



    const handleDeleteClick = (scan: InBodyScan) => {
        setSelectedScan(scan);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedScan) return;
        setSaving(true);
        try {
            await inbodyService.delete(selectedScan.id);
            setIsDeleteDialogOpen(false);
            setSelectedScan(null);
            fetchScans();
        } catch (error) {
            console.error('Failed to delete scan', error);
        } finally {
            setSaving(false);
        }
    };

    const handleViewProgress = async () => {
        if (!selectedClient) return;
        try {
            const data = await inbodyService.getProgress(selectedClient);
            setProgressData(data);
            setIsProgressModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch progress', error);
        }
    };

    const columns: Column<InBodyScan>[] = [
        {
            key: 'scanDate' as keyof InBodyScan,
            header: 'Date',
            render: (scan) => new Date(scan.scanDate).toLocaleDateString(),
        },
        {
            key: 'weight' as keyof InBodyScan,
            header: 'Weight (kg)',
            render: (scan) => Number(scan.weight).toFixed(1),
        },
        {
            key: 'bodyFatPercentage' as keyof InBodyScan,
            header: 'Body Fat %',
            render: (scan) => Number(scan.bodyFatPercentage).toFixed(1) + '%',
        },
        {
            key: 'skeletalMuscleMass' as keyof InBodyScan,
            header: 'Muscle Mass (kg)',
            render: (scan) => Number(scan.skeletalMuscleMass).toFixed(1),
        },
        {
            key: 'bmr' as keyof InBodyScan,
            header: 'BMR',
            render: (scan) => scan.bmr || '-',
        },
        ...(canEdit || canDelete ? [{
            key: 'actions' as keyof InBodyScan,
            header: '',
            render: (scan: InBodyScan) => (
                <ActionButtons
                    showEdit={canEdit}
                    showDelete={canDelete}
                    onEdit={() => navigate(`/inbody/edit/${scan.id}`)}
                    onDelete={() => handleDeleteClick(scan)}
                />
            ),
        }] : []),
    ];

    return (
        <div>
            <PageHeader
                title="InBody Scans"
                description="Track client body composition over time"
                actionLabel="Add Scan"
                onAction={() => navigate('/inbody/new')}
            />

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        Select Client
                    </label>
                    <select
                        value={selectedClient}
                        onChange={e => setSelectedClient(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        <option value="">Choose a client...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.firstName} {client.lastName}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedClient && scans.length >= 2 && (
                    <button
                        onClick={handleViewProgress}
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'var(--color-success)',
                            color: 'white',
                            borderRadius: 'var(--border-radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <Activity size={16} />
                        View Progress
                    </button>
                )}
            </div>

            {selectedClient ? (
                <DataTable columns={columns} data={scans} isLoading={loading} />
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    Select a client to view their InBody scan history
                </div>
            )}

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => { setIsDeleteDialogOpen(false); setSelectedScan(null); }}
                onConfirm={handleDeleteConfirm}
                title="Delete Scan"
                message="Are you sure you want to delete this InBody scan? This action cannot be undone."
                confirmLabel="Delete"
                isDestructive
                loading={saving}
            />

            <Modal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="Progress Summary">
                {progressData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            {/* Weight */}
                            <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Weight</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{Number(progressData.latest.weight).toFixed(1)} kg</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    {progressData.changes.weight > 0 ? <TrendingUp size={14} color="#ef4444" /> : <TrendingDown size={14} color="#10b981" />}
                                    <span style={{ fontSize: '0.75rem', color: progressData.changes.weight > 0 ? '#ef4444' : '#10b981' }}>
                                        {progressData.changes.weight > 0 ? '+' : ''}{Number(progressData.changes.weight).toFixed(1)} kg ({progressData.changes.weightPercent > 0 ? '+' : ''}{Number(progressData.changes.weightPercent).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>

                            {/* Body Fat % */}
                            <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Body Fat %</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{Number(progressData.latest.bodyFatPercentage).toFixed(1)}%</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    {progressData.changes.bodyFatPercentage > 0 ? <TrendingUp size={14} color="#ef4444" /> : <TrendingDown size={14} color="#10b981" />}
                                    <span style={{ fontSize: '0.75rem', color: progressData.changes.bodyFatPercentage > 0 ? '#ef4444' : '#10b981' }}>
                                        {progressData.changes.bodyFatPercentage > 0 ? '+' : ''}{Number(progressData.changes.bodyFatPercentage).toFixed(1)}% ({progressData.changes.bodyFatPercent > 0 ? '+' : ''}{Number(progressData.changes.bodyFatPercent).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>

                            {/* Muscle Mass */}
                            <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Muscle Mass</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{Number(progressData.latest.skeletalMuscleMass).toFixed(1)} kg</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    {progressData.changes.skeletalMuscleMass > 0 ? <TrendingUp size={14} color="#10b981" /> : <TrendingDown size={14} color="#ef4444" />}
                                    <span style={{ fontSize: '0.75rem', color: progressData.changes.skeletalMuscleMass > 0 ? '#10b981' : '#ef4444' }}>
                                        {progressData.changes.skeletalMuscleMass > 0 ? '+' : ''}{Number(progressData.changes.skeletalMuscleMass).toFixed(1)} kg ({progressData.changes.muscleMassPercent > 0 ? '+' : ''}{Number(progressData.changes.muscleMassPercent).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                            Showing changes from {new Date(progressData.first.date).toLocaleDateString()} to {new Date(progressData.latest.date).toLocaleDateString()} ({progressData.totalScans} total scans)
                        </div>

                        {/* Visual Charts */}
                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                            <InBodyTrendsChart data={scans} />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InBodyScans;
