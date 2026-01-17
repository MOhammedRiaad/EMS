import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { packagesService, type Package, type CreatePackageDto } from '../../services/packages.service';
import { Package as PackageIcon, Edit, Archive, RotateCcw, DollarSign, Calendar, Users } from 'lucide-react';

const AdminPackages: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [formData, setFormData] = useState<CreatePackageDto>({
        name: '',
        description: '',
        totalSessions: 10,
        price: 0,
        validityDays: 30
    });

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await packagesService.getAllPackages(showInactive);
            setPackages(data);
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, [showInactive]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPackage) {
                await packagesService.updatePackage(editingPackage.id, formData);
            } else {
                await packagesService.createPackage(formData);
            }
            setIsModalOpen(false);
            resetForm();
            fetchPackages();
        } catch (error) {
            console.error('Error saving package:', error);
            alert('Failed to save package. It may have been assigned to clients.');
        }
    };

    const handleEdit = (pkg: Package) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            description: pkg.description,
            totalSessions: pkg.totalSessions,
            price: pkg.price,
            validityDays: pkg.validityDays
        });
        setIsModalOpen(true);
    };

    const handleArchive = async (pkg: Package) => {
        if (!window.confirm(`Are you sure you want to ${pkg.isActive ? 'archive' : 'restore'} "${pkg.name}"?`)) return;
        try {
            await packagesService.updatePackage(pkg.id, { isActive: !pkg.isActive } as any);
            fetchPackages();
        } catch (error) {
            console.error('Error archiving package:', error);
        }
    };

    const resetForm = () => {
        setEditingPackage(null);
        setFormData({
            name: '',
            description: '',
            totalSessions: 10,
            price: 0,
            validityDays: 30
        });
    };

    const openNewModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <div>
            <PageHeader
                title="Package Management"
                description="Create and manage session packages"
                actionLabel="New Package"
                onAction={openNewModal}
            />

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                    type="checkbox"
                    id="showInactive"
                    checked={showInactive}
                    onChange={e => setShowInactive(e.target.checked)}
                />
                <label htmlFor="showInactive" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Show archived packages
                </label>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : packages.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No packages found. Create your first package!
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {packages.map(pkg => (
                        <div
                            key={pkg.id}
                            style={{
                                padding: '1.5rem',
                                backgroundColor: pkg.isActive ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                                borderRadius: 'var(--border-radius-lg)',
                                border: '1px solid var(--border-color)',
                                opacity: pkg.isActive ? 1 : 0.7
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <PackageIcon size={20} style={{ color: 'var(--color-primary)' }} />
                                    <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>{pkg.name}</h3>
                                </div>
                                {!pkg.isActive && (
                                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                        Archived
                                    </span>
                                )}
                            </div>

                            {pkg.description && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    {pkg.description}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Users size={14} />
                                    <span style={{ fontWeight: 600 }}>{pkg.totalSessions}</span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>sessions</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Calendar size={14} />
                                    <span style={{ fontWeight: 600 }}>{pkg.validityDays}</span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>days</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                                <DollarSign size={18} style={{ color: 'var(--color-success)' }} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Number(pkg.price).toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(pkg)}
                                    style={{ padding: '0.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <Edit size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => handleArchive(pkg)}
                                    style={{ padding: '0.5rem', color: pkg.isActive ? 'var(--color-danger)' : 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    {pkg.isActive ? <><Archive size={16} /> Archive</> : <><RotateCcw size={16} /> Restore</>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPackage ? 'Edit Package' : 'Create Package'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Package Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                            placeholder="e.g., Starter Pack"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', minHeight: '60px' }}
                            placeholder="Optional description"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Sessions</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={formData.totalSessions}
                                onChange={e => setFormData({ ...formData, totalSessions: parseInt(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price</label>
                            <input
                                type="number"
                                required
                                min={0}
                                step={0.01}
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Validity (days)</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={formData.validityDays}
                                onChange={e => setFormData({ ...formData, validityDays: parseInt(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                        >
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
                            {editingPackage ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminPackages;
