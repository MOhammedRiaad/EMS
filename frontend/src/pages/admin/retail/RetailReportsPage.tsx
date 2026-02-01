import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import { api } from '../../../services/api';

interface Transaction {
    id: string;
    type: string;
    category: string;
    amount: number;
    description: string;
    createdAt: string;
    client?: {
        firstName: string;
        lastName: string;
    };
    creator?: {
        firstName: string;
        lastName: string;
    };
}

const RetailReportsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Set default range to current month
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let query = `/retail/transactions?`;
            if (startDate) query += `startDate=${startDate}&`;
            if (endDate) query += `endDate=${endDate}`;

            const res = await api.get(query);
            setTransactions(res.data);
        } catch (error) {
            console.error('Failed to load reports', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchTransactions();
        }
    }, [startDate, endDate]);

    const columns: Column<Transaction>[] = [
        {
            key: 'createdAt',
            header: 'Date',
            render: (item) => new Date(item.createdAt).toLocaleString()
        },
        {
            key: 'client',
            header: 'Client',
            render: (item) => item.client ? `${item.client.firstName} ${item.client.lastName}` : 'Walk-in / N/A'
        },
        {
            key: 'type',
            header: 'Type',
            render: (item) => (
                <span className={`px-2 py-1 rounded text-xs uppercase font-semibold ${item.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {item.type}
                </span>
            )
        },
        {
            key: 'category',
            header: 'Category',
            render: (item) => <span className="capitalize">{item.category.replace('_', ' ')}</span>
        },
        {
            key: 'description',
            header: 'Description',
            render: (item) => <span>{item.description}</span>
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (item) => (
                <span className={`font-medium ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.amount > 0 ? '+' : ''}{Number(item.amount).toFixed(2)} €
                </span>
            )
        },
        {
            key: 'creator',
            header: 'Staff',
            render: (item) => item.creator ? `${item.creator.firstName} ${item.creator.lastName}` : '-'
        }
    ];

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalRefunds = transactions
        .filter(t => t.type === 'refund' || t.type === 'expense') // Check logic closer
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    return (
        <div>
            <PageHeader
                title="POS Reports"
                description="Retail and Financial Transaction History"
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        />
                    </div>
                    <div>
                        <button
                            onClick={fetchTransactions}
                            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income (Selected Period)</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{totalIncome.toFixed(2)} €</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Refunds/Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{totalRefunds.toFixed(2)} €</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <DataTable
                    columns={columns}
                    data={transactions}
                    isLoading={loading}
                />
            </div>
        </div>
    );
};

export default RetailReportsPage;
