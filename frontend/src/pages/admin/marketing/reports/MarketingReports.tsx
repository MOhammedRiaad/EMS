import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { leadService, type Lead } from '../../../../services/lead.service';
import { TrendingUp, Users, UserCheck } from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

const MarketingReports: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await leadService.getAll();
            setLeads(data);
        } catch (error) {
            console.error('Failed to load leads', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
    }

    // Process data for charts
    const sourceData = leads.reduce((acc: any[], lead) => {
        const source = lead.source || 'Unknown';
        const existing = acc.find(item => item.name === source);
        if (existing) {
            existing.value++;
        } else {
            acc.push({ name: source, value: 1 });
        }
        return acc;
    }, []);

    const statusData = leads.reduce((acc: any[], lead) => {
        const status = lead.status.replace('_', ' ').toUpperCase();
        const existing = acc.find(item => item.name === status);
        if (existing) {
            existing.value++;
        } else {
            acc.push({ name: status, value: 1 });
        }
        return acc;
    }, []);

    // KPIs
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
    const recentLeads = leads.filter(l => {
        const date = new Date(l.createdAt);
        const now = new Date();
        return date >= new Date(now.setDate(now.getDate() - 7));
    }).length;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Leads</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalLeads}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Conversion Rate</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{conversionRate}%</h3>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Converted Leads</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{convertedLeads}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <UserCheck size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Last 7 Days</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{recentLeads}</h3>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <Users size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Lead Status Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {statusData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Source Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Lead Source Breakdown</h3>
                    <div className="h-[300px] w-full flex justify-center text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {sourceData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingReports;
