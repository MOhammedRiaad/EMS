import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import DataTable, { type Column } from '../../common/DataTable';
import { clientsService } from '../../../services/clients.service';

const WaiversTab: React.FC = () => {
    const { id: clientId } = useParams<{ id: string }>();
    const [waivers, setWaivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWaivers = async () => {
            if (!clientId) return;
            setLoading(true);
            try {
                const data = await clientsService.getWaivers(clientId);
                setWaivers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchWaivers();
    }, [clientId]);

    const columns: Column<any>[] = [
        {
            key: 'waiverId',
            header: 'Waiver ID',
            render: (item) => <span className="font-mono text-xs">{item.waiverId?.substring(0, 8)}...</span>
        },
        {
            key: 'version',
            header: 'Version',
            render: (item) => item.waiver?.version || 'N/A'
        },
        {
            key: 'signedAt',
            header: 'Signed Date',
            render: (item) => new Date(item.signedAt).toLocaleDateString() + ' ' + new Date(item.signedAt).toLocaleTimeString()
        },
        {
            key: 'ipAddress',
            header: 'IP Address',
            render: (item) => <span className="text-gray-500 text-xs">{item.ipAddress}</span>
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (item) => (
                <button className="text-primary-600 hover:text-primary-800" title="View Signature">
                    <Eye className="w-4 h-4" />
                </button>
            )
        }
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Signed Waivers</h3>
            </div>
            <DataTable
                columns={columns}
                data={waivers}
                isLoading={loading}
            />
        </div>
    );
};

export default WaiversTab;
