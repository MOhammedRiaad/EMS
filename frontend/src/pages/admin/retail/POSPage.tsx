import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Search, CreditCard, User, Building } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import { retailService, type Product } from '../../../services/retail.service';
import { type Client } from '../../../services/clients.service';
import { api } from '../../../services/api';

// Using common components where possible, or native tailwind elements
import Modal from '../../../components/common/Modal'; // Assuming default export or adjust imports
import { FormSelect, FormInput } from '../../../components/common/FormField';

interface CartItem extends Product {
    cartQuantity: number;
}

const POSPage: React.FC = () => {
    // State
    const [studios, setStudios] = useState<any[]>([]);
    const [selectedStudioId, setSelectedStudioId] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Fetch Initial Data
    useEffect(() => {
        const init = async () => {
            try {
                const [studiosRes, clientsRes] = await Promise.all([
                    api.get('/studios'),
                    api.get('/clients?status=active')
                ]);
                setStudios(studiosRes.data);
                if (studiosRes.data.length > 0) setSelectedStudioId(studiosRes.data[0].id);
                setClients(clientsRes.data.data || clientsRes.data);
            } catch (e) {
                console.error(e);
            }
        };
        init();
    }, []);

    // Fetch Products when Studio changes
    useEffect(() => {
        if (!selectedStudioId) return;
        setLoading(true);
        retailService.getStudioStock(selectedStudioId).then(data => {
            const active = data.filter(p => p.isActive);
            setProducts(active);
            setFilteredProducts(active);
        }).finally(() => setLoading(false));
    }, [selectedStudioId]);

    // Search Filter
    useEffect(() => {
        const lower = searchQuery.toLowerCase();
        setFilteredProducts(products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.sku?.toLowerCase().includes(lower)
        ));
    }, [searchQuery, products]);

    // Cart Logic
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, cartQuantity: p.cartQuantity + 1 } : p);
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p.id !== productId));
    };

    const updateQuantity = (productId: string, qty: number) => {
        if (qty <= 0) return removeFromCart(productId);
        setCart(prev => prev.map(p => p.id === productId ? { ...p, cartQuantity: qty } : p));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.cartQuantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!selectedStudioId) return;

        if (paymentMethod === 'on_account' && !selectedClientId) {
            setErrorMsg('Select a client for On-Account payment');
            return;
        }

        try {
            const payload = {
                studioId: selectedStudioId,
                clientId: selectedClientId || undefined,
                paymentMethod,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.cartQuantity
                }))
            };

            await retailService.createSale(payload);
            setSuccessMsg('Transaction Completed!');
            setTimeout(() => setSuccessMsg(null), 3000);

            setCart([]);
            setPaymentModalVisible(false);
            setSelectedClientId('');
            // Refresh stock
            if (selectedStudioId) {
                retailService.getStudioStock(selectedStudioId).then(data => {
                    const active = data.filter(p => p.isActive);
                    setProducts(active);
                    setFilteredProducts(active);
                });
            }
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || 'Transaction failed');
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    const getClientBalance = () => {
        if (!selectedClientId) return null;
        const client = clients.find(c => c.id === selectedClientId);
        return client?.creditBalance ? Number(client.creditBalance) : 0;
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            {/* Global Messages */}
            {errorMsg && (
                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
                    {successMsg}
                </div>
            )}

            <div className="flex h-full gap-6">
                {/* Product Grid - Left Side */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex space-x-4 items-center">
                        <div className="w-1/3">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Studio</label>
                            <FormSelect
                                value={selectedStudioId}
                                onChange={(e) => setSelectedStudioId(e.target.value)}
                            >
                                {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </FormSelect>
                        </div>
                        <div className="flex-1 relative">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Search Products</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <FormInput
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or SKU..."
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-500">Loading products...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">No products found</div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
                                    >
                                        <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-400">
                                            <span className="text-xs">No Image</span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 h-10">{item.name}</h3>
                                        <div className="mt-auto flex justify-between items-center">
                                            <span className="text-sm font-bold text-primary-600">€{Number(item.price).toFixed(2)}</span>
                                            <span className="text-xs text-gray-500">Stock: {item.stockQuantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart & Checkout - Right Side */}
                <div className="w-96 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        <div className="flex items-center space-x-2 font-semibold text-gray-900 dark:text-gray-100">
                            <ShoppingCart className="h-5 w-5" />
                            <span>Current Order</span>
                        </div>
                        <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">{cart.length} items</span>
                    </div>

                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
                        <label className="text-xs font-medium text-gray-500">Assign Client (Optional)</label>
                        <FormSelect
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                        >
                            <option value="">Guest / Walk-in</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                        </FormSelect>
                        {selectedClientId && (
                            <div className={`text-xs mt-1 px-2 py-1 rounded ${(getClientBalance() ?? 0) < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                }`}>
                                Current Balance: €{(getClientBalance() ?? 0).toFixed(2)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                <ShoppingCart className="h-12 w-12 opacity-20" />
                                <span className="text-sm">Cart is empty</span>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</div>
                                        <div className="text-xs text-gray-500">€{Number(item.price).toFixed(2)} / unit</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.cartQuantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                            className="w-12 p-1 text-center text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600"
                                        />
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-sm text-gray-500">Total Amount</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">€{cartTotal.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => setPaymentModalVisible(true)}
                            disabled={cart.length === 0}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                            <CreditCard className="h-5 w-5" />
                            <span>Checkout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModalVisible && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setPaymentModalVisible(false)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                                            Checkout Payment
                                        </h3>
                                        <div className="mt-4 space-y-4">
                                            <p className="text-sm text-gray-500">
                                                Select payment method for total amount: <span className="font-bold text-gray-900 dark:text-gray-100">€{cartTotal.toFixed(2)}</span>
                                            </p>

                                            <div className="space-y-2">
                                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                    <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                                                    <span className="ml-3 font-medium text-gray-900 dark:text-gray-100">Cash Payment</span>
                                                </label>

                                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                                                    <span className="ml-3 font-medium text-gray-900 dark:text-gray-100">Card / Terminal</span>
                                                </label>

                                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${!selectedClientId ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : paymentMethod === 'on_account' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value="on_account"
                                                        disabled={!selectedClientId}
                                                        checked={paymentMethod === 'on_account'}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                    />
                                                    <div className="ml-3 flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">Charge to Account</span>
                                                        {selectedClientId && <span className="text-xs text-gray-500">Balance: €{getClientBalance()?.toFixed(2)}</span>}
                                                        {!selectedClientId && <span className="text-xs text-red-500">Client required</span>}
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleCheckout}
                                >
                                    Process Payment
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setPaymentModalVisible(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSPage;
