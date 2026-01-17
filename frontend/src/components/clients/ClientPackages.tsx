import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import ReceiptModal from '../common/ReceiptModal';
import { packagesService, type Package, type ClientPackage as ClientPackageType } from '../../services/packages.service';
import { Package as PackageIcon, Plus, RefreshCw, Check, AlertTriangle, Printer } from 'lucide-react';

interface ClientPackagesProps {
    clientId: string;
    clientName: string;
}

const ClientPackages: React.FC<ClientPackagesProps> = ({ clientId, clientName }) => {
    const [clientPackages, setClientPackages] = useState<ClientPackageType[]>([]);
    const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [selectedPackageForRenew, setSelectedPackageForRenew] = useState<ClientPackageType | null>(null);
    const [formData, setFormData] = useState({
        packageId: '',
        paymentMethod: 'cash',
        paymentNotes: ''
    });
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cpData, pkgData] = await Promise.all([
                packagesService.getClientPackages(clientId),
                packagesService.getAllPackages()
            ]);
            setClientPackages(cpData);
            setAvailablePackages(pkgData);
            if (pkgData.length > 0) {
                setFormData(prev => ({ ...prev, packageId: pkgData[0].id }));
            }
        } catch (error) {
            console.error('Error fetching client packages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await packagesService.assignPackage({
                clientId,
                packageId: formData.packageId,
                paymentMethod: formData.paymentMethod,
                paymentNotes: formData.paymentNotes
            });
            setIsAssignModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error assigning package:', error);
            alert('Failed to assign package');
        }
    };

    const handleRenew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPackageForRenew) return;
        try {
            await packagesService.renewPackage(
                selectedPackageForRenew.id,
                formData.packageId !== selectedPackageForRenew.packageId ? formData.packageId : undefined,
                formData.paymentMethod
            );
            setIsRenewModalOpen(false);
            setSelectedPackageForRenew(null);
            fetchData();
        } catch (error) {
            console.error('Error renewing package:', error);
            alert('Failed to renew package');
        }
    };

    const openRenewModal = (cp: ClientPackageType) => {
        setSelectedPackageForRenew(cp);
        setFormData({
            packageId: cp.packageId,
            paymentMethod: 'cash',
            paymentNotes: ''
        });
        setIsRenewModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'var(--color-success)';
            case 'depleted': return 'var(--color-warning)';
            case 'expired': return 'var(--color-danger)';
            default: return 'var(--color-text-secondary)';
        }
    };

    const showReceipt = (cp: ClientPackageType) => {
        const pkg = availablePackages.find(p => p.id === cp.packageId) || cp.package;
        setReceiptData({
            receiptNumber: `RCP-${cp.id.slice(0, 8).toUpperCase()}`,
            date: cp.purchaseDate,
            clientName: clientName,
            packageName: pkg?.name || 'Package',
            sessions: cp.sessionsUsed + cp.sessionsRemaining,
            validityDays: pkg?.validityDays || 30,
            expiryDate: cp.expiryDate,
            amount: Number(pkg?.price) || 0,
            paymentMethod: cp.paymentMethod || 'cash',
            studioName: 'EMS Studio'
        });
        setIsReceiptModalOpen(true);
    };

    const activePackage = clientPackages.find(cp => cp.status === 'active');

    return (
        <div style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            marginTop: '1.5rem'
        }}>
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PackageIcon size={20} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 600 }}>Package & Sessions</span>
                </div>
                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem'
                    }}
                >
                    <Plus size={16} /> Assign Package
                </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
                {loading ? (
                    <div>Loading...</div>
                ) : activePackage ? (
                    <div>
                        {/* Active Package Card */}
                        <div style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--border-radius-md)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{activePackage.package.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Expires: {new Date(activePackage.expiryDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <span style={{
                                    backgroundColor: getStatusColor(activePackage.status),
                                    color: 'white',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase'
                                }}>
                                    {activePackage.status}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                    <span>Sessions Used</span>
                                    <span>{activePackage.sessionsUsed} / {activePackage.sessionsUsed + activePackage.sessionsRemaining}</span>
                                </div>
                                <div style={{
                                    height: '8px',
                                    backgroundColor: 'var(--border-color)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(activePackage.sessionsUsed / (activePackage.sessionsUsed + activePackage.sessionsRemaining)) * 100}%`,
                                        backgroundColor: activePackage.sessionsRemaining <= 2 ? 'var(--color-warning)' : 'var(--color-success)',
                                        transition: 'width 0.3s'
                                    }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {activePackage.sessionsRemaining} sessions remaining
                                </span>
                                {activePackage.sessionsRemaining <= 2 && (
                                    <button
                                        onClick={() => openRenewModal(activePackage)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'var(--color-warning)',
                                            color: 'white',
                                            borderRadius: 'var(--border-radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <RefreshCw size={14} /> Renew
                                    </button>
                                )}
                                <button
                                    onClick={() => showReceipt(activePackage)}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--border-radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.875rem'
                                    }}
                                    title="Print Receipt"
                                >
                                    <Printer size={14} /> Receipt
                                </button>
                            </div>
                        </div>

                        {/* Low Sessions Warning */}
                        {activePackage.sessionsRemaining <= 2 && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid var(--color-warning)',
                                borderRadius: 'var(--border-radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--color-warning)'
                            }}>
                                <AlertTriangle size={18} />
                                <span style={{ fontSize: '0.875rem' }}>
                                    Low sessions! Consider renewing the package.
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                        <PackageIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <div>No active package</div>
                        <div style={{ fontSize: '0.875rem' }}>Assign a package to start tracking sessions</div>
                    </div>
                )}

                {/* Package History */}
                {clientPackages.length > 1 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                            Package History
                        </div>
                        {clientPackages.filter(cp => cp.id !== activePackage?.id).map(cp => (
                            <div
                                key={cp.id}
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <span>{cp.package.name}</span>
                                <span style={{ color: getStatusColor(cp.status) }}>{cp.status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title={`Assign Package to ${clientName}`}
            >
                <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Package</label>
                        <select
                            required
                            value={formData.packageId}
                            onChange={e => setFormData({ ...formData, packageId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            {availablePackages.map(pkg => (
                                <option key={pkg.id} value={pkg.id}>
                                    {pkg.name} - {pkg.totalSessions} sessions - ${Number(pkg.price).toFixed(2)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Payment Method</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Notes</label>
                        <input
                            type="text"
                            value={formData.paymentNotes}
                            onChange={e => setFormData({ ...formData, paymentNotes: e.target.value })}
                            placeholder="Optional payment notes"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{ padding: '0.5rem 1rem' }}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: 'var(--border-radius-md)'
                            }}
                        >
                            Assign Package
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Renew Modal */}
            <Modal
                isOpen={isRenewModalOpen}
                onClose={() => setIsRenewModalOpen(false)}
                title="Renew Package"
            >
                <form onSubmit={handleRenew} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Package</label>
                        <select
                            value={formData.packageId}
                            onChange={e => setFormData({ ...formData, packageId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            {availablePackages.map(pkg => (
                                <option key={pkg.id} value={pkg.id}>
                                    {pkg.name} - {pkg.totalSessions} sessions - ${Number(pkg.price).toFixed(2)}
                                    {pkg.id === selectedPackageForRenew?.packageId ? ' (Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Payment Method</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsRenewModalOpen(false)} style={{ padding: '0.5rem 1rem' }}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'var(--color-success)',
                                color: 'white',
                                borderRadius: 'var(--border-radius-md)'
                            }}
                        >
                            <Check size={16} style={{ marginRight: '0.25rem' }} /> Confirm Renewal
                        </button>
                    </div>
                </form>
            </Modal>

            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                receiptData={receiptData}
            />
        </div>
    );
};

export default ClientPackages;
