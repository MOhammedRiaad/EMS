import { useState, useEffect, useCallback } from 'react';
import { clientPortalService } from '../../services/client-portal.service';
import { inbodyService, type InBodyScan } from '../../services/inbody.service';

export function useClientProgressState() {
    const [scans, setScans] = useState<InBodyScan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const profile = await clientPortalService.getProfile();
            if (profile?.id) {
                const scanData = await inbodyService.getByClient(profile.id);
                setScans(scanData);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load progress data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const latestScan = scans.length > 0 ? scans[0] : null;

    return {
        scans,
        latestScan,
        loading,
        error,
        loadData
    };
}
