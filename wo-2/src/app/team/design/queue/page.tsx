"use client";

import { useEffect, useState } from "react";
import {
    Ticket,
    Search,
    ArrowRight,
    CheckCircle2,
    Timer,
    Eye,
    Video,
    Calendar,
    Palette,
    ListOrdered,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function DesignQueuePage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch all design category tickets that are verified/in progress
            const { data } = await supabase
                .from('work_orders')
                .select('*')
                .eq('category', 'Design')
                .in('status', ['Verified', 'Execution', 'Review', 'Open'])
                .order('created_at', { ascending: false });

            if (data) setTickets(data);
            setLoading(false);
        } catch (err) {
            console.error("Error loading tickets:", err);
            setLoading(false);
        }
    }

    async function handleStatusUpdate(ticketId: string, newStatus: string) {
        setUpdating(ticketId);
        try {
            const { error } = await supabase
                .from('work_orders')
                .update({ status: newStatus })
                .eq('id', ticketId);

            if (error) throw error;

            // Reload
            await loadTickets();
            alert(`Status berhasil diubah ke "${newStatus}"`);
        } catch (err: any) {
            alert("Gagal update status: " + err.message);
        }
        setUpdating(null);
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Verified': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Execution': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Review': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Open': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
            default: return 'bg-zinc-100 text-zinc-600';
        }
    };

    const getNextStatus = (status: string) => {
        switch (status) {
            case 'Verified': return 'Execution';
            case 'Execution': return 'Review';
            default: return null;
        }
    };

    const filtered = tickets.filter((t: any) => {
        const matchSearch = search === '' ||
            t.title?.toLowerCase().includes(search.toLowerCase()) ||
            t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
            t.brand?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ListOrdered size={24} /> Antrian Tiket Design
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Daftar tiket design yang bisa dikerjakan. Update status sesuai progress.
                </p>
            </header>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        placeholder="Cari tiket..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 text-sm rounded-xl border border-border bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="all">Semua Status</option>
                    <option value="Verified">Verified (Siap Dikerjakan)</option>
                    <option value="Execution">Execution (Sedang Dikerjakan)</option>
                    <option value="Review">Review (Menunggu Approval)</option>
                    <option value="Open">Open (Menunggu Verifikasi)</option>
                </select>
            </div>

            {/* Ticket List */}
            <div className="space-y-3">
                {filtered.length > 0 ? filtered.map((ticket, i) => {
                    const nextStatus = getNextStatus(ticket.status);
                    return (
                        <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <Link href={`/team/design/ticket/${ticket.id}`} className="min-w-0 flex-1 cursor-pointer group">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <span className="text-[10px] font-mono text-muted-foreground">#{ticket.ticket_number}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.priority === 'P1' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{ticket.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1"><Palette size={10} /> {ticket.brand}</span>
                                        {ticket.deadline && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} />
                                                {new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                        {ticket.meeting_type === 'Online' && (
                                            <span className="flex items-center gap-1 text-blue-500"><Video size={10} /> Online Meeting</span>
                                        )}
                                    </div>
                                </Link>
                                <div className="flex flex-col gap-2 shrink-0">
                                    {nextStatus && (
                                        <button
                                            onClick={() => handleStatusUpdate(ticket.id, nextStatus)}
                                            disabled={updating === ticket.id}
                                            className="text-xs font-bold px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {updating === ticket.id ? (
                                                <div className="w-3 h-3 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <ArrowRight size={12} />
                                            )}
                                            {nextStatus}
                                        </button>
                                    )}
                                    {ticket.status === 'Review' && (
                                        <span className="text-[10px] text-center font-medium text-purple-500">Menunggu Approval</span>
                                    )}
                                    {ticket.meeting_type === 'Online' && !['Completed', 'Rejected'].includes(ticket.status) && (
                                        <Link
                                            href={`/dashboard/ticket/${ticket.id}/meet`}
                                            className="text-xs font-bold px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                                        >
                                            <Video size={12} /> Join Meet
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                }) : (
                    <div className="py-16 text-center">
                        <Ticket size={40} className="mx-auto mb-3 text-zinc-300" />
                        <p className="font-bold">Tidak ada tiket</p>
                        <p className="text-xs text-muted-foreground mt-1">Belum ada tiket design yang tersedia.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
