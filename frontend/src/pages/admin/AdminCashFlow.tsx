import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { packagesService, type Transaction } from '../../services/packages.service';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

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
        <div>
            <PageHeader
                title="Cash Flow"
                description="Track income, expenses, and cash balance"
                actionLabel="Add Transaction"
                onAction={() => setIsModalOpen(true)}
            />

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--border-radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <DollarSign size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Current Balance</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(balance)}</div>
                </div>

                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--border-radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <TrendingUp size={20} style={{ color: 'var(--color-success)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Income</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {formatCurrency(summary.income)}
                    </div>
                </div>

                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--border-radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <TrendingDown size={20} style={{ color: 'var(--color-danger)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Expenses</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                        {formatCurrency(summary.expense + summary.refund)}
                    </div>
                </div>

                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--border-radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <RefreshCw size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Net Profit</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: summary.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {formatCurrency(summary.net)}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                    Recent Transactions
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No transactions yet
                    </div>
                ) : (
                    <div>
                        {transactions.slice(0, 20).map(tx => (
                            <div
                                key={tx.id}
                                style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: tx.type === 'income' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {tx.type === 'income' ? (
                                            <ArrowUpRight size={20} style={{ color: 'var(--color-success)' }} />
                                        ) : (
                                            <ArrowDownRight size={20} style={{ color: 'var(--color-danger)' }} />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{tx.description || tx.category}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {formatDate(tx.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: 600,
                                    color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Transaction Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Transaction"
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="refund">Refund</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="package_sale">Package Sale</option>
                            <option value="session_fee">Session Fee</option>
                            <option value="refund">Refund</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Amount</label>
                        <input
                            type="number"
                            required
                            min={0.01}
                            step={0.01}
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: 'var(--border-radius-md)'
                            }}
                        >
                            Add Transaction
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminCashFlow;
