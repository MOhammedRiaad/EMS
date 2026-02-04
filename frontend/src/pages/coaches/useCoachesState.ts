import { useState, useEffect, useMemo, useCallback } from 'react';
import { coachesService, type CoachDisplay } from '../../services/coaches.service';
import { studiosService, type Studio } from '../../services/studios.service';

export interface CoachFormData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    studioId: string;
    bio: string;
    specializations: string;
    preferredClientGender: 'male' | 'female' | 'any';
    availabilityRules: AvailabilityRule[];
}

export interface AvailabilityRule {
    dayOfWeek: string;
    available: boolean;
    startTime: string;
    endTime: string;
}

export interface CoachFilters {
    studioId: string;
    activeStatus: string;
}

const defaultAvailabilityRules: AvailabilityRule[] = [
    { dayOfWeek: 'monday', available: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 'tuesday', available: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 'wednesday', available: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 'thursday', available: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 'friday', available: true, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 'saturday', available: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 'sunday', available: false, startTime: '09:00', endTime: '17:00' }
];

// Map numeric day indices (0-6) to day names
const dayIndexToName: Record<number, string> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
};

// Normalize availability rules: convert numeric dayOfWeek to string names
const normalizeAvailabilityRules = (rules: any[]): AvailabilityRule[] => {
    if (!rules || !Array.isArray(rules)) return defaultAvailabilityRules;

    return rules.map(rule => ({
        ...rule,
        dayOfWeek: typeof rule.dayOfWeek === 'number'
            ? dayIndexToName[rule.dayOfWeek] || 'monday'
            : String(rule.dayOfWeek).toLowerCase()
    }));
};

const initialFormState: CoachFormData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: 'male',
    studioId: '',
    bio: '',
    specializations: '',
    preferredClientGender: 'any',
    availabilityRules: defaultAvailabilityRules
};

const initialFilters: CoachFilters = {
    studioId: 'all',
    activeStatus: 'all'
};

export function useCoachesState() {
    // Data state
    const [coaches, setCoaches] = useState<CoachDisplay[]>([]);
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<CoachDisplay | null>(null);

    // Form state
    const [formData, setFormData] = useState<CoachFormData>(initialFormState);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<CoachFilters>(initialFilters);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [coachesData, studiosData] = await Promise.all([
                coachesService.getAll(searchQuery),
                studiosService.getAll()
            ]);
            setCoaches(coachesData);
            setStudios(studiosData);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Debounce fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);

    // Filtered coaches (local filters only)
    const filteredCoaches = useMemo(() => {
        return coaches.filter(coach => {
            if (filters.studioId !== 'all' && coach.studioId !== filters.studioId) return false;
            if (filters.activeStatus === 'active' && !coach.active) return false;
            if (filters.activeStatus === 'inactive' && coach.active) return false;
            return true;
        });
    }, [coaches, filters]);

    // Handlers
    const resetForm = useCallback(() => {
        setFormData(initialFormState);
        setError(null);
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
        setError(null);
        setSaving(true);
        try {
            await coachesService.createWithUser({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                studioId: formData.studioId,
                bio: formData.bio || undefined,
                specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : undefined,
                preferredClientGender: formData.preferredClientGender
            });
            setIsCreateModalOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to create coach');
        } finally {
            setSaving(false);
        }
    }, [formData, resetForm, fetchData]);

    const handleEdit = useCallback((coach: CoachDisplay) => {
        setSelectedCoach(coach);
        setFormData({
            email: coach.email || '',
            password: '',
            firstName: coach.firstName,
            lastName: coach.lastName,
            gender: 'male',
            studioId: coach.studioId || '',
            bio: coach.bio || '',
            specializations: coach.specializations?.join(', ') || '',
            preferredClientGender: coach.preferredClientGender || 'any',
            availabilityRules: normalizeAvailabilityRules(coach.availabilityRules || [])
        });
        setIsEditModalOpen(true);
    }, []);

    const handleUpdate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoach) return;
        setSaving(true);
        try {
            await coachesService.update(selectedCoach.id, {
                bio: formData.bio,
                specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : [],
                preferredClientGender: formData.preferredClientGender,
                availabilityRules: formData.availabilityRules
            });
            setIsEditModalOpen(false);
            setSelectedCoach(null);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Failed to update coach', err);
        } finally {
            setSaving(false);
        }
    }, [formData, selectedCoach, resetForm, fetchData]);

    const handleToggleActive = useCallback(async (coachId: string, currentActive: boolean) => {
        try {
            await coachesService.update(coachId, { active: !currentActive });
            fetchData();
        } catch (err) {
            console.error('Failed to toggle coach status', err);
        }
    }, [fetchData]);

    const handleDeleteClick = useCallback((coach: CoachDisplay) => {
        setSelectedCoach(coach);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedCoach) return;
        setSaving(true);
        try {
            await coachesService.delete(selectedCoach.id);
            setIsDeleteDialogOpen(false);
            setSelectedCoach(null);
            fetchData();
        } catch (err) {
            console.error('Failed to delete coach', err);
        } finally {
            setSaving(false);
        }
    }, [selectedCoach, fetchData]);

    return {
        // Data
        coaches,
        filteredCoaches,
        studios,

        // UI state
        loading,
        saving,
        error,

        // Modal state
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        selectedCoach,
        setSelectedCoach,

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
        handleDeleteConfirm
    };
}
