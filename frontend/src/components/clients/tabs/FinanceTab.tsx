import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DollarSign, Plus, History } from 'lucide-react';
import DataTable, { type Column } from '../../common/DataTable';
import Modal from '../../common/Modal';
import { FormField, FormInput, FormTextarea } from '../../common/FormField';
import { clientsService } from '../../../services/clients.service';
import { packagesService } from '../../../services/packages.service';
import { api } from '../../../services/api';

interface Transaction {
    id: string;
    type: string;
    category: string;
    amount: number;
    description: string;
    createdAt: string;
    runningBalance: number;
    clientRunningBalance?: number;
    status?: 'paid' | 'pending';
}

const FinanceTab: React.FC = () => {
    const { id: clientId } = useParams<{ id: string }>();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [creditBalance, setCreditBalance] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Add Funds Form
    const [amount, setAmount] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [processing, setProcessing] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Confirm Payment
    const [confirmingTx, setConfirmingTx] = useState<Transaction | null>(null);
    const [confirmPaymentMethod, setConfirmPaymentMethod] = useState('cash');

    const showNotify = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, message: msg });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchFinanceData = async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            // Fetch Client for Balance
            const clientRes = await api.get(`/clients/${clientId}`);
            setCreditBalance(Number(clientRes.data.creditBalance || 0));

            // Fetch Transactions
            const txData = await clientsService.getTransactions(clientId);
            setTransactions(txData);
        } catch (error) {
            console.error(error);
            showNotify('error', 'Failed to load finance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, [clientId]);

    const handleAddFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (!clientId) return;
            await clientsService.adjustBalance(clientId, amount, description || 'Manual Balance Adjustment');
            showNotify('success', 'Funds added successfully');
            setIsModalVisible(false);
            setAmount(0);
            setDescription('');
            fetchFinanceData();
        } catch (error) {
            showNotify('error', 'Failed to add funds');
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmingTx) return;
        setProcessing(true);
        try {
            await packagesService.confirmPayment(confirmingTx.id, confirmPaymentMethod);
            showNotify('success', 'Payment confirmed');
            setConfirmingTx(null);
            fetchFinanceData();
        } catch (error) {
            showNotify('error', 'Failed to confirm payment');
        } finally {
            setProcessing(false);
        }
    };

    const columns: Column<Transaction>[] = [
        {
            key: 'createdAt',
            header: 'Date',
            render: (item) => new Date(item.createdAt).toLocaleDateString()
        },
        {
            key: 'type',
            header: 'Type',
            render: (item) => (
                <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-center ${item.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {item.type}
                    </span>
                    {item.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-center bg-yellow-100 text-yellow-800">
                            Pending
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'category',
            header: 'Category',
            render: (item) => <span className="text-gray-600 dark:text-gray-400 text-sm capitalize">{item.category?.replace('_', ' ')}</span>
        },
        {
            key: 'description',
            header: 'Description',
            render: (item) => <span className="text-gray-900 dark:text-gray-200">{item.description}</span>
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (item) => (
                <div className="flex flex-col">
                    <span className={`font-medium ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.amount > 0 ? '+' : ''}{Number(item.amount).toFixed(2)} €
                    </span>
                    {item.status === 'pending' && (
                        <button
                            onClick={() => setConfirmingTx(item)}
                            className="text-[10px] text-primary-600 underline hover:text-primary-700 text-left"
                        >
                            Confirm Payment
                        </button>
                    )}
                </div>
            )
        },
        {
            key: 'clientRunningBalance',
            header: 'Balance',
            render: (item) => item.clientRunningBalance != null ? <span className="text-gray-600 dark:text-gray-400">{Number(item.clientRunningBalance).toFixed(2)} €</span> : '-'
        },
    ];

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded z-50 border ${notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
                    }`}>
                    {notification.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Credit Balance</p>
                            <h3 className={`text-2xl font-bold mt-1 ${creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {creditBalance.toFixed(2)} €
                            </h3>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalVisible(true)}
                        className="mt-4 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Funds
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spend</p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                        {/* We can calculate this from transactions or backend */}0.00 €
                    </h3>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <History className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transaction History</h3>
                </div>
                <DataTable
                    columns={columns}
                    data={transactions}
                    isLoading={loading}
                />
            </div>

            {isModalVisible && (
                <Modal
                    title="Add Funds / Adjust Balance"
                    isOpen={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                >
                    <form onSubmit={handleAddFunds} className="space-y-4">
                        <FormField label="Amount (€)" required>
                            <FormInput
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Use negative value for refunds/deductions.</p>
                        </FormField>

                        <FormField label="Description" required>
                            <FormTextarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                                rows={2}
                            />
                        </FormField>

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
                                disabled={processing}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {confirmingTx && (
                <Modal
                    title="Confirm Payment"
                    isOpen={!!confirmingTx}
                    onClose={() => setConfirmingTx(null)}
                >
                    <form onSubmit={handleConfirmPayment} className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded text-sm">
                            <p className="text-gray-600 dark:text-gray-400">Transaction:</p>
                            <p className="font-medium">{confirmingTx.description}</p>
                            <p className="font-bold mt-1 text-primary-600">{Number(confirmingTx.amount).toFixed(2)} €</p>
                        </div>

                        <FormField label="Payment Method" required>
                            <select
                                value={confirmPaymentMethod}
                                onChange={e => setConfirmPaymentMethod(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 sm:text-sm"
                                required
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Credit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="online">Online Payment</option>
                                <option value="other">Other</option>
                            </select>
                        </FormField>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setConfirmingTx(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {processing ? 'Confirming...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default FinanceTab;
