import { useState, useEffect } from 'react';
import { clientPortalService } from '../services/client-portal.service';

export const useClientProfile = () => {
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await clientPortalService.getProfile();
                setClient(data);
            } catch (err: any) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    return { client, loading, error };
};
