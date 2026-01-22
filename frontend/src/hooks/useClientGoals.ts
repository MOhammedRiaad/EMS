import { useState, useEffect, useCallback } from 'react';
import { clientPortalService } from '../services/client-portal.service';

export const useClientGoals = () => {
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(0);

    const refetch = useCallback(() => {
        setVersion(v => v + 1);
    }, []);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const data = await clientPortalService.getGoals();
                setGoals(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, [version]);

    return { goals, loading, refetch };
};
