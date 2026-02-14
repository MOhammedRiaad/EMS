import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { packagesService, type Transaction } from '../../services/packages.service';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from 'lucide-react';

const AdminCashFlow: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [summary, setSummary] = useState({ income: 0, expense: 0, refund: 0, net: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'income' as 'income' | 'expense' | 'refund',
        category: 'other',
        amount: 0,
        description: ''
    });
    const [confirmingTx, setConfirmingTx] = useState<Transaction | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txData, balanceData, summaryData] = await Promise.all([
                packagesService.getTransactions(),
                packagesService.getBalance(),
                packagesService.getSummary()
            ]);
            setTransactions(txData);
            setBalance(balanceData.balance);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching cash flow data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await packagesService.createTransaction(formData);
            setIsModalOpen(false);
            setFormData({ type: 'income', category: 'other', amount: 0, description: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating transaction:', error);
            alert('Failed to create transaction');
        }
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmingTx) return;
        try {
            await packagesService.confirmPayment(confirmingTx.id, paymentMethod);
            setConfirmingTx(null);
            fetchData();
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert('Failed to confirm payment');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Cash Flow"
                description="Track income, expenses, and cash balance"
                actionLabel="Add Transaction"
                onAction={() => setIsModalOpen(true)}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(balance)}</div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.income)}</div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.expense + (summary.refund || 0))}</div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <RefreshCw size={20} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</span>
                    </div>
                    <div className={`text-2xl font-bold ${summary.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(summary.net)}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                        No transactions yet
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {transactions.slice(0, 50).map(tx => (
                            <div
                                key={tx.id}
                                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'income'
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                        : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                        }`}>
                                        {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-semibold text-gray-900 dark:text-white">{tx.description || tx.category}</span>
                                            {tx.status === 'pending' && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(tx.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {tx.status === 'pending' && (
                                        <button
                                            onClick={() => setConfirmingTx(tx)}
                                            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-blue-200 dark:border-blue-800/50"
                                        >
                                            Confirm Payment
                                        </button>
                                    )}
                                    <div className={`font-bold text-lg ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div >

            {/* Add Transaction Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Transaction"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all dark:text-white"
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="refund">Refund</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all dark:text-white"
                        >
                            <option value="package_sale">Package Sale</option>
                            <option value="session_fee">Session Fee</option>
                            <option value="manual_adjustment">Manual Adjustment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all dark:text-white"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all dark:text-white min-h-[80px]"
                            placeholder="Optional description"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Save Transaction
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Payment Modal */}
            <Modal
                isOpen={!!confirmingTx}
                onClose={() => setConfirmingTx(null)}
                title="Confirm Payment"
            >
                <form onSubmit={handleConfirmPayment} className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-2">Transaction Details</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            {confirmingTx?.description || confirmingTx?.category}
                        </p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                            {formatCurrency(confirmingTx?.amount || 0)}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all dark:text-white"
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Credit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="online">Online Payment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setConfirmingTx(null)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminCashFlow;
