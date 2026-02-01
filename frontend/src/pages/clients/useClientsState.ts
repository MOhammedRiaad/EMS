import { useState, useEffect, useMemo, useCallback } from 'react';
import { clientsService, type Client } from '../../services/clients.service';
import { studiosService, type Studio } from '../../services/studios.service';
import { storageService } from '../../services/storage.service';

export interface ClientFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gender: 'male' | 'female' | 'other' | 'pnts';
    phone: string;
    avatarUrl: string;
    studioId: string;
}

export interface ClientFilters {
    status: string;
}

const initialFormState: ClientFormData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: 'male',
    phone: '',
    avatarUrl: '',
    studioId: ''
};

const initialFilters: ClientFilters = {
    status: 'all'
};

export function useClientsState() {
    // Data state
    const [clients, setClients] = useState<Client[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Form state
    const [formData, setFormData] = useState<ClientFormData>(initialFormState);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ClientFilters>(initialFilters);

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const [clientsData, studiosData] = await Promise.all([
                clientsService.getAll(searchQuery),
                studiosService.getAll()
            ]);
            setClients(clientsData);
            setStudios(studiosData);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Debounce fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchClients]);

    // Filtered clients (local filters only)
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            if (filters.status !== 'all' && client.status !== filters.status) return false;
            return true;
        });
    }, [clients, filters]);

    // Handlers
    const resetForm = useCallback(() => {
        setFormData(initialFormState);
    }, []);

    const handleFilterChange = useCallback((key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearchQuery('');
        setFilters(initialFilters);
    }, []);

    const handleCreate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await clientsService.createWithUser(formData);
            setIsCreateModalOpen(false);
            resetForm();
            fetchClients();
        } catch (error) {
            console.error('Failed to create client', error);
        } finally {
            setSaving(false);
        }
    }, [formData, resetForm, fetchClients]);

    const handleEdit = useCallback((client: Client) => {
        setSelectedClient(client);
        setFormData({
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email || '',
            password: '',
            gender: client.user?.gender || 'male',
            phone: client.phone || '',
            avatarUrl: client.avatarUrl || '',
            studioId: client.studioId || ''
        });
        setIsEditModalOpen(true);
    }, []);

    const handleUpdate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setSaving(true);
        try {
            // Send fields allowed by UpdateClientDto (including gender which updates the linked user)
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                avatarUrl: formData.avatarUrl,
                studioId: formData.studioId || undefined,
                gender: formData.gender
            };
            await clientsService.update(selectedClient.id, updateData);
            setIsEditModalOpen(false);
            setSelectedClient(null);
            resetForm();
            fetchClients();
        } catch (error) {
            console.error('Failed to update client', error);
        } finally {
            setSaving(false);
        }
    }, [formData, selectedClient, resetForm, fetchClients]);

    const handleToggleActive = useCallback(async (clientId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await clientsService.update(clientId, { status: newStatus });
            fetchClients();
        } catch (err) {
            console.error('Failed to toggle client status', err);
        }
    }, [fetchClients]);

    const handleDeleteClick = useCallback((client: Client) => {
        setSelectedClient(client);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedClient) return;
        setSaving(true);
        try {
            await clientsService.delete(selectedClient.id);
            setIsDeleteDialogOpen(false);
            setSelectedClient(null);
            fetchClients();
        } catch (error) {
            console.error('Failed to delete client', error);
        } finally {
            setSaving(false);
        }
    }, [selectedClient, fetchClients]);

    const handleInvite = useCallback(async (client: Client) => {
        if (!client.email) {
            alert('Client must have an email address to receive an invitation.');
            return;
        }
        if (!confirm(`Send invitation email to ${client.firstName}?`)) return;

        try {
            await clientsService.invite(client.id);
            alert('Invitation sent successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to send invitation');
        }
    }, []);

    const handleManagePackages = useCallback((client: Client) => {
        setSelectedClient(client);
        setIsPackageModalOpen(true);
    }, []);

    const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const url = await storageService.upload(file);
                setFormData(prev => ({ ...prev, avatarUrl: url }));
            } catch (err) {
                console.error(err);
            } finally {
                setUploading(false);
            }
        }
    }, []);

    return {
        // Data
        clients,
        filteredClients,
        studios,

        // UI state
        loading,
        saving,
        uploading,

        // Modal state
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        isPackageModalOpen,
        setIsPackageModalOpen,
        selectedClient,
        setSelectedClient,

        // Form
        formData,
        setFormData,
        resetForm,

        // Filters
        searchQuery,
        setSearchQuery,
        filters,
        handleFilterChange,
        handleClearFilters,

        // Handlers
        handleCreate,
        handleEdit,
        handleUpdate,
        handleToggleActive,
        handleDeleteClick,
        handleDeleteConfirm,
        handleInvite,
        handleAvatarUpload,
        handleManagePackages
    };
}
