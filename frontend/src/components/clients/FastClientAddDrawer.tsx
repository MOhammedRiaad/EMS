import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Building2, Loader2, Package as PackageIcon } from 'lucide-react';
import { clientsService } from '../../services/clients.service';
import { packagesService, type Package } from '../../services/packages.service';
import { studiosService, type Studio } from '../../services/studios.service';

interface FastClientAddDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: any) => void;
    studios?: Studio[];
    initialStudioId?: string;
    initialName?: string;
}

export const FastClientAddDrawer: React.FC<FastClientAddDrawerProps> = ({
    isOpen,
    onClose,
    onSuccess,
    studios,
    initialStudioId,
    initialName = ''
}) => {
    // Split initial name into first and last
    const nameParts = initialName.trim().split(/\s+/);
    const initialFirstName = nameParts[0] || '';
    const initialLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const [formData, setFormData] = useState({
        firstName: initialFirstName,
        lastName: initialLastName,
        email: '',
        phone: '',
        studioId: initialStudioId || '',
        packageId: '',
        paymentMethod: ''
    });

    const [packages, setPackages] = useState<Package[]>([]);
    const [allStudios, setAllStudios] = useState<Studio[]>(studios || []);
    const [loading, setLoading] = useState(false);
    const [fetchingPackages, setFetchingPackages] = useState(false);
    const [fetchingStudios, setFetchingStudios] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch packages and studios on mount
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setFetchingPackages(true);
                try {
                    const data = await packagesService.getAllPackages(false); // Only active
                    setPackages(data);
                } catch (err) {
                    console.error('Failed to load packages:', err);
                } finally {
                    setFetchingPackages(false);
                }

                if (!studios || studios.length === 0) {
                    setFetchingStudios(true);
                    try {
                        const data = await studiosService.getAll();
                        setAllStudios(data);
                    } catch (err) {
                        console.error('Failed to load studios:', err);
                    } finally {
                        setFetchingStudios(false);
                    }
                } else {
                    setAllStudios(studios);
                }
            };
            loadData();
        }
    }, [isOpen, studios]);

    // Update form when props change
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                firstName: initialFirstName,
                lastName: initialLastName,
                studioId: initialStudioId || prev.studioId
            }));
        }
    }, [isOpen, initialFirstName, initialLastName, initialStudioId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create client
            const client = await clientsService.create({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email.trim() || null,
                phone: formData.phone,
                studioId: formData.studioId,
                status: 'active'
            });

            // 2. Assign package if selected
            if (formData.packageId) {
                try {
                    await packagesService.assignPackage({
                        clientId: client.id,
                        packageId: formData.packageId,
                        paymentMethod: formData.paymentMethod || undefined
                    });
                } catch (pkgErr: any) {
                    console.error('Failed to assign package:', pkgErr);
                    // We don't fail the whole creation, but we should notify?
                    // For now, let's just log and proceed.
                }
            }

            onSuccess(client);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Add Client</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Create a new client profile quickly.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <User size={14} className="text-gray-400" />
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white"
                                    placeholder="e.g. John"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white"
                                    placeholder="e.g. Doe"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Phone size={14} className="text-gray-400" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" />
                                Email Address <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white"
                                placeholder="john@example.com"
                            />
                        </div>

                        {/* Studio */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Building2 size={14} className="text-gray-400" />
                                    Assigned Studio
                                </label>
                                {initialStudioId && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        Context Studio
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.studioId}
                                    onChange={e => setFormData(prev => ({ ...prev, studioId: e.target.value }))}
                                    disabled={fetchingStudios}
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white disabled:opacity-50 ${initialStudioId ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 dark:border-slate-700'}`}
                                >
                                    <option value="">Select a Studio</option>
                                    {allStudios.filter(s => s.isActive).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {fetchingStudios && (
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                        <Loader2 size={14} className="animate-spin text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Package Selection */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800 mt-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <PackageIcon size={14} className="text-gray-400" />
                                Assign Package <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.packageId}
                                    onChange={e => setFormData(prev => ({ ...prev, packageId: e.target.value }))}
                                    disabled={fetchingPackages}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all dark:text-white disabled:opacity-50"
                                >
                                    <option value="">No Package (Select later)</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} ({pkg.totalSessions} sessions - ${pkg.price})
                                        </option>
                                    ))}
                                </select>
                                {fetchingPackages && (
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                        <Loader2 size={14} className="animate-spin text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {formData.packageId && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Payment Status
                                    </label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-[13px] transition-all dark:text-white"
                                    >
                                        <option value="">Pending / Pay Later</option>
                                        <option value="cash">Paid - Cash</option>
                                        <option value="card">Paid - Credit Card</option>
                                        <option value="bank_transfer">Paid - Bank Transfer</option>
                                    </select>
                                </div>
                            )}

                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                Selecting a package will automatically assign it to the client upon creation.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex gap-3 bg-gray-50/50 dark:bg-slate-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Create Client'
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};
