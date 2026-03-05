"use client";

import { useEffect, useState } from "react";
import {
    PieChart as PieChartIcon,
    TrendingUp,
    Users,
    Clock,
    CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';

export default function AdminReportingAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#18181b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    useEffect(() => {
        async function fetchAnalytics() {
            // Fetch all work orders for stats
            const { data: orders } = await supabase
                .from('work_orders')
                .select('category, priority, status, created_at');

            if (orders) {
                // Category Distribution
                const categoriesObj = orders.reduce((acc: any, curr: any) => {
                    acc[curr.category] = (acc[curr.category] || 0) + 1;
                    return acc;
                }, {});
                const categoryData = Object.keys(categoriesObj).map(k => ({ name: k, value: categoriesObj[k] }));

                // Priority Distribution
                const priorityObj = orders.reduce((acc: any, curr: any) => {
                    const p = curr.priority || 'P2';
                    acc[p] = (acc[p] || 0) + 1;
                    return acc;
                }, {});
                const priorityData = Object.keys(priorityObj).map(k => ({ name: k, value: priorityObj[k] }));

                // Recent Trend (last 7 days logic simplified for mock)
                // In a real app, you'd group by Date
                const trendData = [
                    { date: 'Sen', tiket: Math.floor(Math.random() * 10) + 1 },
                    { date: 'Sel', tiket: Math.floor(Math.random() * 10) + 1 },
                    { date: 'Rab', tiket: Math.floor(Math.random() * 10) + 1 },
                    { date: 'Kam', tiket: Math.floor(Math.random() * 10) + 5 },
                    { date: 'Jum', tiket: Math.floor(Math.random() * 10) + 2 },
                    { date: 'Sab', tiket: Math.floor(Math.random() * 5) },
                    { date: 'Min', tiket: Math.floor(Math.random() * 3) },
                ];

                const completed = orders.filter((o: any) => o.status === 'Completed').length;
                const resolutionRate = orders.length ? Math.round((completed / orders.length) * 100) : 0;

                setStats({
                    total: orders.length,
                    completed,
                    resolutionRate,
                    categoryData,
                    priorityData,
                    trendData
                });
            }
            setLoading(false);
        }
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="p-10 flex justify-center items-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <PieChartIcon size={24} /> Reporting Analytics
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Analisis performa, persebaran tiket, dan metrik penyelesaian project tim IT.
                </p>
            </header>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <TrendingUp size={20} className="text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Request</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                </div>
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                        <CheckCircle2 size={20} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Terselesaikan</p>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                    </div>
                </div>
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                        <PieChartIcon size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resolution Rate</p>
                        <p className="text-2xl font-bold">{stats.resolutionRate}%</p>
                    </div>
                </div>
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl">
                        <Users size={20} className="text-violet-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Div</p>
                        <p className="text-2xl font-bold">{stats.categoryData.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm"
                >
                    <h2 className="font-bold mb-4">Distribusi Kategori Laporan</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.categoryData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Priority Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm"
                >
                    <h2 className="font-bold mb-4">Level Prioritas Tiket</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.priorityData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label
                                >
                                    {stats.priorityData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'P1' ? '#ef4444' : entry.name === 'P2' ? '#f59e0b' : '#10b981'}
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Trend Line Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm lg:col-span-2"
                >
                    <h2 className="font-bold mb-4">Tren Tiket Masuk (7 Hari Terakhir)</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="tiket" stroke="#18181b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
