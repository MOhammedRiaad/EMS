import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inbodyService, type CreateInBodyScanInput } from '../../services/inbody.service';
import { clientsService, type Client } from '../../services/clients.service';

const getInitialFormState = (clientId?: string): CreateInBodyScanInput => ({
    clientId: clientId || '',
    scanDate: new Date().toISOString().split('T')[0],
    weight: 0,
    bodyFatMass: 0,
    skeletalMuscleMass: 0,
    bodyFatPercentage: 0,
    notes: '',
});

export function useInBodyScanFormState() {
    const navigate = useNavigate();
    const { scanId, clientId } = useParams<{ scanId?: string; clientId?: string }>();
    const isEdit = Boolean(scanId);

    const [clients, setClients] = useState<Client[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [formData, setFormData] = useState<CreateInBodyScanInput>(getInitialFormState(clientId));

    const fetchClients = useCallback(async () => {
        try {
            const data = await clientsService.getAll();
            setClients(data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        }
    }, []);

    const fetchScan = useCallback(async () => {
        if (!scanId) return;
        try {
            const scan = await inbodyService.getAll();
            const found = scan.find(s => s.id === scanId);
            if (found) {
                setFormData({
                    clientId: found.clientId,
                    scanDate: found.scanDate,
                    weight: found.weight,
                    bodyFatMass: found.bodyFatMass,
                    skeletalMuscleMass: found.skeletalMuscleMass,
                    bodyFatPercentage: found.bodyFatPercentage,
                    rightArmMuscle: found.rightArmMuscle || undefined,
                    leftArmMuscle: found.leftArmMuscle || undefined,
                    trunkMuscle: found.trunkMuscle || undefined,
                    rightLegMuscle: found.rightLegMuscle || undefined,
                    leftLegMuscle: found.leftLegMuscle || undefined,
                    bmr: found.bmr || undefined,
                    visceralFatLevel: found.visceralFatLevel || undefined,
                    bodyWater: found.bodyWater || undefined,
                    protein: found.protein || undefined,
                    mineral: found.mineral || undefined,
                    notes: found.notes || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch scan', error);
        } finally {
            setLoading(false);
        }
    }, [scanId]);

    useEffect(() => {
        fetchClients();
        if (isEdit && scanId) {
            fetchScan();
        }
    }, [fetchClients, fetchScan, isEdit, scanId]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit && scanId) {
                await inbodyService.update(scanId, formData);
            } else {
                await inbodyService.create(formData);
            }
            navigate('/inbody');
        } catch (error) {
            console.error('Failed to save scan', error);
        } finally {
            setSaving(false);
        }
    }, [isEdit, scanId, formData, navigate]);

    const handleNavigateBack = useCallback(() => {
        if (clientId) {
            navigate(`/coach/clients/${clientId}`);
        } else {
            navigate('/inbody');
        }
    }, [clientId, navigate]);

    const updateFormData = useCallback((updates: Partial<CreateInBodyScanInput>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    // Auto-calculate body fat mass when weight or percentage changes
    const updateBodyFatPercentage = useCallback((percentage: number) => {
        const mass = formData.weight ? (formData.weight * percentage / 100) : 0;
        setFormData(prev => ({
            ...prev,
            bodyFatPercentage: percentage,
            bodyFatMass: parseFloat(mass.toFixed(1))
        }));
    }, [formData.weight]);

    return {
        // Data
        clients,
        formData,

        // State
        loading,
        saving,
        isEdit,
        clientId,

        // Handlers
        handleSubmit,
        handleNavigateBack,
        updateFormData,
        updateBodyFatPercentage,
        navigate
    };
}
