import React, { useState, useEffect } from 'react';
import { Save, RefreshCcw } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import { retailService, type Product } from '../../../services/retail.service';
import { api } from '../../../services/api';
import DataTable, { type Column } from '../../../components/common/DataTable';
import { FormSelect, FormInput } from '../../../components/common/FormField';

const InventoryPage: React.FC = () => {
    const [studios, setStudios] = useState<any[]>([]);
    const [selectedStudioId, setSelectedStudioId] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});

    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showNotify = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, message: msg });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        // Fetch Studios
        const fetchStudios = async () => {
            try {
                const res = await api.get('/studios');
                setStudios(res.data);
                if (res.data.length > 0) setSelectedStudioId(res.data[0].id);
            } catch (error) {
                console.error(error);
            }
        };
        fetchStudios();
    }, []);

    const fetchStock = async () => {
        if (!selectedStudioId) return;
        setLoading(true);
        try {
            const data = await retailService.getStudioStock(selectedStudioId);
            setProducts(data);
        } catch (error) {
            showNotify('error', 'Failed to load stock');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, [selectedStudioId]);

    const handleQuantityChange = (productId: string, value: string) => {
        const qty = parseInt(value);
        if (isNaN(qty)) return;
        setStockUpdates(prev => ({ ...prev, [productId]: qty }));
    };

    const handleUpdateStock = async (productId: string) => {
        if (!selectedStudioId || stockUpdates[productId] === undefined) return;
        try {
            await retailService.updateStock(selectedStudioId, productId, stockUpdates[productId], 'set');
            showNotify('success', 'Stock updated');

            // Update local state to reflect change
            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, stockQuantity: stockUpdates[productId] } : p
            ));

            // Clear pending update
            const newUpdates = { ...stockUpdates };
            delete newUpdates[productId];
            setStockUpdates(newUpdates);
        } catch (error) {
            showNotify('error', 'Update failed');
        }
    };

    const columns: Column<Product>[] = [
        {
            key: 'name',
            header: 'Product',
            render: (item) => <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
        },
        {
            key: 'stockQuantity',
            header: 'Current Stock',
            render: (item) => {
                const qty = item.stockQuantity || 0;
                let colorClass = 'bg-gray-100 text-gray-800';
                if (qty > 10) colorClass = 'bg-green-100 text-green-800';
                else if (qty > 0) colorClass = 'bg-yellow-100 text-yellow-800';
                else colorClass = 'bg-red-100 text-red-800';

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {qty}
                    </span>
                );
            }
        },
        {
            key: 'update',
            header: 'Update Stock',
            render: (item) => (
                <div className="flex space-x-2 items-center">
                    <div className="w-24">
                        <FormInput
                            type="number"
                            min="0"
                            placeholder="New Qty"
                            defaultValue={item.stockQuantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            style={{ padding: '0.4rem' }}
                        />
                    </div>
                    <button
                        onClick={() => handleUpdateStock(item.id)}
                        disabled={stockUpdates[item.id] === undefined}
                        className="p-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Save Stock"
                    >
                        <Save className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            {notification && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded z-50 border ${notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
                    }`}>
                    {notification.message}
                </div>
            )}

            <PageHeader
                title="Inventory"
                description="Manage product stock by studio"
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 mt-6">
                <div className="flex items-center space-x-4">
                    <div className="w-64">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Select Studio</label>
                        <FormSelect
                            value={selectedStudioId}
                            onChange={(e) => setSelectedStudioId(e.target.value)}
                            disabled={studios.length === 0}
                        >
                            {studios.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </FormSelect>
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={fetchStock}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <DataTable
                    columns={columns}
                    data={products}
                    isLoading={loading}
                />
            </div>
        </div>
    );
};

export default InventoryPage;
