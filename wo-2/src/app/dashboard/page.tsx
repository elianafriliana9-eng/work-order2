"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Layout,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    ArrowRight,
    User,
    LogOut,
    Code2,
    Archive
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [ongoingTasks, setOngoingTasks] = useState<any[]>([]);
    const [userName, setUserName] = useState<string>("");
    const [loadingOngoing, setLoadingOngoing] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function getData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");

                // Fetch personal tickets (exclude archived: Completed & Rejected)
                const { data: personalData } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('user_id', user.id)
                    .not('status', 'in', '("Completed","Rejected")')
                    .order('created_at', { ascending: false });

                if (personalData) setTickets(personalData);

                // Fetch Team Ongoing Tasks (Global Execution status)
                setLoadingOngoing(true);
                const { data: ongoingData } = await supabase
                    .from('work_orders')
                    .select('title, brand, category, status, priority, created_at')
                    .eq('status', 'Execution')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (ongoingData) setOngoingTasks(ongoingData);
                setLoadingOngoing(false);
            }
        }
        getData();
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/");
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Triaging': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Execution': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400';
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard User [V2]</h1>
                        <p className="text-muted-foreground mt-1">Kelola dan pantau status permintaan Work Order Anda.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/archive"
                            className="flex items-center gap-2 px-5 py-3 border border-border rounded-xl font-bold text-sm text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Archive size={18} /> Arsip
                        </Link>
                        <Link
                            href="/new-ticket"
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} /> Buat Ticket Baru
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: "Total Ticket", value: tickets.length, icon: Layout, color: "text-zinc-500" },
                    { label: "Dalam Antrian", value: tickets.filter((t: any) => t.status === 'Open').length, icon: Clock, color: "text-amber-500" },
                    { label: "Selesai", value: tickets.filter((t: any) => t.status === 'Completed').length, icon: CheckCircle2, color: "text-green-500" },
                    { label: "Urgent (P1)", value: tickets.filter((t: any) => t.priority === 'P1').length, icon: AlertCircle, color: "text-red-500" },
                ].map((stat) => (
                    <div key={stat.label} className="p-6 rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Team Live Pipeline (Ongoing Projects) */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Team Live Pipeline</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {loadingOngoing ? (
                        <div className="col-span-full py-4 text-center text-xs text-muted-foreground italic">Loading pipeline...</div>
                    ) : ongoingTasks.length > 0 ? (
                        ongoingTasks.map((task, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Code2 size={40} className="text-blue-600" />
                                </div>
                                <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter mb-1 truncate">
                                    {task.category}
                                </div>
                                <div className="text-xs font-bold text-foreground line-clamp-1 mb-2">
                                    {task.title}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white uppercase">Ongoing</span>
                                    <span className="text-[9px] text-muted-foreground font-medium">{task.brand}</span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full p-6 rounded-2xl border border-dashed border-border text-center">
                            <p className="text-xs text-muted-foreground italic">Antrian pengerjaan sedang kosong. ✨</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Ticket List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold">Daftar Permintaan</h3>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                placeholder="Cari ticket..."
                                className="pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full sm:w-64"
                            />
                        </div>
                        <button className="p-2 border border-border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            <Filter size={18} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                    {tickets.length > 0 ? (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800 text-muted-foreground font-semibold">
                                    <th className="px-6 py-4">Judul & Brand</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Deadline</th>
                                    <th className="px-6 py-4">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tickets.map((ticket, i) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-foreground">{ticket.title}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{ticket.brand}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 font-medium text-xs">
                                                {ticket.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-medium">
                                            {new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <Link
                                                href={`/dashboard/ticket/${ticket.id}`}
                                                className="flex items-center gap-1.5 text-primary font-bold hover:underline"
                                            >
                                                Detail <ArrowRight size={14} />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    ) : null}
                </div>

                {/* Mobile cards */}
                <div className="md:hidden p-4 space-y-3">
                    {tickets.length > 0 ? (
                        tickets.map((ticket, i) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-zinc-900 rounded-xl border border-border p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="font-bold text-sm text-foreground truncate">{ticket.title}</p>
                                        <p className="text-xs text-muted-foreground">{ticket.brand}</p>
                                    </div>
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-medium text-[10px]">
                                            {ticket.category}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/dashboard/ticket/${ticket.id}`}
                                        className="flex items-center gap-1 text-primary font-bold text-xs"
                                    >
                                        Detail <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-16 text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                    <Layout size={40} />
                                </div>
                            </div>
                            <h4 className="font-bold text-lg">Belum ada ticket</h4>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                                Anda belum membuat permintaan Work Order apapun. Silakan buat ticket baru.
                            </p>
                            <Link
                                href="/new-ticket"
                                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-secondary text-secondary-foreground font-bold rounded-lg hover:opacity-90 transition-all border border-border"
                            >
                                Buat Ticket Pertama
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
