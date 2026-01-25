import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import { retailService, type Product } from '../../../services/retail.service';
import DataTable, { type Column } from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import { FormField, FormInput, FormSelect, FormTextarea } from '../../../components/common/FormField';
// However, rewriting a toast system is out of scope unless we have one. POSPage kept 'message' imports? Wait, I removed AntD imports in POSPage.
// POSPage used `setErrorMsg` state locally. I should do the same here or assume a global toast exists.
// Checking imports... POSPage had Local Error/Success Messages. I will do the same here.

const ProductListPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        category: 'other',
        price: 0,
        sku: '',
        description: '',
        isActive: true
    });

    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showNotify = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, message: msg });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await retailService.getProducts();
            setProducts(data);
        } catch (error) {
            showNotify('error', 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAdd = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category: 'other',
            price: 0,
            sku: '',
            description: '',
            isActive: true
        });
        setIsModalVisible(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({ ...product });
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await retailService.deleteProduct(id);
            showNotify('success', 'Product deleted');
            fetchProducts();
        } catch (error) {
            showNotify('error', 'Failed to delete product');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await retailService.updateProduct(editingProduct.id, formData);
                showNotify('success', 'Product updated');
            } else {
                await retailService.createProduct(formData as any);
                showNotify('success', 'Product created');
            }
            setIsModalVisible(false);
            fetchProducts();
        } catch (error) {
            showNotify('error', 'Failed to save product');
        }
    };

    const columns: Column<Product>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (item) => <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
        },
        {
            key: 'category',
            header: 'Category',
            render: (item) => (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs uppercase font-semibold">
                    {item.category}
                </span>
            )
        },
        {
            key: 'price',
            header: 'Price',
            render: (item) => <span className="text-gray-900 dark:text-gray-100">€{Number(item.price).toFixed(2)}</span>
        },
        {
            key: 'sku',
            header: 'SKU',
            render: (item) => <span className="text-gray-500 font-mono text-xs">{item.sku || '-'}</span>
        },
        {
            key: 'isActive',
            header: 'Status',
            render: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (item) => (
                <div className="flex space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-blue-500 hover:text-blue-700">
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
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
                title="Products"
                description="Manage retail products"
                actionLabel="Add Product"
                onAction={handleAdd}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-6">
                <DataTable
                    columns={columns}
                    data={products}
                    isLoading={loading}
                />
            </div>

            {isModalVisible && (
                <Modal
                    title={editingProduct ? 'Edit Product' : 'Add Product'}
                    isOpen={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                >
                    <form onSubmit={handleSave} className="space-y-4">
                        <FormField label="Product Name" required>
                            <FormInput
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </FormField>

                        <FormField label="Category" required>
                            <FormSelect
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="beverage">Beverage</option>
                                <option value="supplement">Supplement</option>
                                <option value="gear">Gear</option>
                                <option value="clothing">Clothing</option>
                                <option value="other">Other</option>
                            </FormSelect>
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Price (€)" required>
                                <FormInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    required
                                />
                            </FormField>
                            <FormField label="SKU">
                                <FormInput
                                    value={formData.sku || ''}
                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                />
                            </FormField>
                        </div>

                        <FormField label="Description">
                            <FormTextarea
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </FormField>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Product</label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setIsModalVisible(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default ProductListPage;
