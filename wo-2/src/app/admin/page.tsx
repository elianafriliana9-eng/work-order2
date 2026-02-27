"use client";

import { useEffect, useState } from "react";
import {
    Palette,
    Ticket,
    Clock,
    CheckCircle2,
    TrendingUp,
    Send,
    ArrowRight,
    Monitor,
    Timer,
    FileText,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/lib/supabase";

export default function AdminDashboardPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [role, setRole] = useState<string>("");
    const [userName, setUserName] = useState("");

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin");

            // Get role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const userRole = profile?.role || 'designer';
            setRole(userRole);

            // Fetch tickets based on role
            let query = supabase.from('work_orders').select('*');

            if (userRole === 'head_it') {
                // Head IT sees all tickets
                query = query.order('created_at', { ascending: false });
            } else {
                // Team members see assigned tickets
                query = query
                    .or(`assigned_to.eq.${user.id},assigned_role.eq.${userRole}`)
                    .order('created_at', { ascending: false });
            }

            const { data: ticketData } = await query;
            if (ticketData) setTickets(ticketData);

            // Fetch recent reports
            const { data: reportData } = await supabase
                .from('daily_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (reportData) setReports(reportData);
        }
        loadData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
            case 'Verified': return 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400';
            case 'On Progress': case 'Execution': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Review': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700';
        }
    };

    const onProgress = tickets.filter(t => ['Execution', 'On Progress'].includes(t.status));
    const completed = tickets.filter(t => t.status === 'Completed');
    const pendingReview = tickets.filter(t => t.status === 'Review');
    const open = tickets.filter(t => t.status === 'Open');

    const isHeadIT = role === 'head_it';
    const greeting = isHeadIT ? `Selamat datang, ${userName}` : `Halo, ${userName}!`;
    const subtitle = isHeadIT
        ? "Overview seluruh project tim IT."
        : "Ini adalah project yang ditugaskan kepada Anda.";

    const chartData = [
        { name: 'Design', Total: completed.filter(t => t.category === 'Design').length },
        { name: 'IT Dev', Total: completed.filter(t => t.category === 'Programming').length },
        { name: 'IT Support', Total: completed.filter(t => t.category === 'Asset').length },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
                <p className="text-muted-foreground mt-1">{subtitle}</p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { label: "Total Tiket", value: tickets.length, icon: Ticket, color: "text-zinc-500" },
                    { label: "Dikerjakan", value: onProgress.length, icon: Monitor, color: "text-blue-500" },
                    { label: "Selesai", value: completed.length, icon: CheckCircle2, color: "text-green-500" },
                    { label: isHeadIT ? "Perlu Approval" : "Dalam Review", value: isHeadIT ? open.length : pendingReview.length, icon: Clock, color: "text-amber-500" },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-sm"
                    >
                        <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 ${stat.color} w-fit mb-3`}>
                            <stat.icon size={18} />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Chart for Head IT */}
            {isHeadIT && (
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 size={20} className="text-zinc-500" />
                        <h2 className="text-lg font-bold">Project Selesai Per Divisi</h2>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 shadow-sm h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="Total" fill="#18181b" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* Active Projects */}
            {onProgress.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Monitor size={20} className="text-blue-500" />
                            Project Aktif
                        </h2>
                        <Link href="/admin/tickets" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            Lihat Semua <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {onProgress.slice(0, 6).map((ticket, i) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <Link
                                    href={`/admin/tickets/${ticket.id}`}
                                    className="block p-5 rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-500/5 dark:to-zinc-900 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            On Progress
                                        </span>
                                        {ticket.priority === 'P1' && (
                                            <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full">P1</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-sm mb-1 line-clamp-1">{ticket.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-3">{ticket.brand} • {ticket.category}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Timer size={12} />
                                        <span>{new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className="mb-10">
                <h2 className="text-lg font-bold mb-5">Aksi Cepat</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/admin/tickets"
                        className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 hover:shadow-md transition-all group"
                    >
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                            <Ticket size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Kelola Tiket</h3>
                            <p className="text-xs text-muted-foreground">Lihat dan update tiket</p>
                        </div>
                        <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {!isHeadIT && (
                        <Link
                            href="/admin/reports/submit"
                            className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 hover:shadow-md transition-all group"
                        >
                            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                                <Send size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Laporan Harian</h3>
                                <p className="text-xs text-muted-foreground">Submit laporan hari ini</p>
                            </div>
                            <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}

                    {isHeadIT && (
                        <Link
                            href="/admin/reports"
                            className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 hover:shadow-md transition-all group"
                        >
                            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                                <FileText size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Laporan Tim</h3>
                                <p className="text-xs text-muted-foreground">Lihat laporan harian tim</p>
                            </div>
                            <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}

                    <Link
                        href="/dashboard"
                        className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 hover:shadow-md transition-all group"
                    >
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                            <TrendingUp size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Dashboard User</h3>
                            <p className="text-xs text-muted-foreground">Kembali ke dashboard</p>
                        </div>
                        <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* Recent Reports (Team only) */}
            {!isHeadIT && reports.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                        <FileText size={20} className="text-zinc-500" />
                        Laporan Terakhir Anda
                    </h2>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden">
                        <div className="divide-y divide-border">
                            {reports.map((report) => (
                                <div key={report.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold">{report.content?.substring(0, 60)}...</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(report.report_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                                                style={{ width: `${report.progress_pct}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground">{report.progress_pct}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
