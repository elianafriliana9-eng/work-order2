"use client";

import { useEffect, useState } from "react";
import {
    Ticket,
    Search,
    Filter,
    ArrowRight,
    Hash,
    CheckCircle2,
    XCircle,
    Timer,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [role, setRole] = useState("");
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function loadTickets() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const userRole = profile?.role || 'designer';
            setRole(userRole);

            let query = supabase.from('work_orders').select('*');

            if (userRole === 'head_it') {
                query = query.order('created_at', { ascending: false });
            } else {
                query = query
                    .or(`assigned_to.eq.${user.id},assigned_role.eq.${userRole}`)
                    .order('created_at', { ascending: false });
            }

            const { data } = await query;
            if (data) setTickets(data);
        }
        loadTickets();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
            case 'Verified': return 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400';
            case 'Execution': case 'On Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Review': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700';
        }
    };

    const statusFilters = ['all', 'Open', 'Execution', 'Review', 'Completed', 'Rejected'];
    const isHeadIT = role === 'head_it';

    const filteredTickets = tickets.filter(t => {
        const matchesFilter = filter === 'all' || t.status === filter;
        const matchesSearch = search === '' ||
            t.title?.toLowerCase().includes(search.toLowerCase()) ||
            t.brand?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    async function handleApprove(ticketId: string) {
        const { error } = await supabase
            .from('work_orders')
            .update({ status: 'Verified' })
            .eq('id', ticketId);

        if (!error) {
            setTickets(prev =>
                prev.map(t => t.id === ticketId ? { ...t, status: 'Verified' } : t)
            );
        }
    }

    async function handleReject(ticketId: string) {
        const reason = prompt("Alasan penolakan:");
        if (!reason) return;

        const { error } = await supabase
            .from('work_orders')
            .update({ status: 'Rejected', admin_notes: reason })
            .eq('id', ticketId);

        if (!error) {
            setTickets(prev =>
                prev.map(t => t.id === ticketId ? { ...t, status: 'Rejected', admin_notes: reason } : t)
            );
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Ticket size={24} /> Kelola Tiket
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {isHeadIT ? "Semua tiket dari seluruh divisi." : "Tiket yang ditugaskan kepada Anda."}
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
                <div className="flex gap-1.5 flex-wrap">
                    {statusFilters.map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${filter === s
                                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                                    : "border-border text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                }`}
                        >
                            {s === 'all' ? 'Semua' : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ticket Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredTickets.length > 0 ? (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800 text-muted-foreground font-semibold">
                                    <th className="px-5 py-3.5">No.</th>
                                    <th className="px-5 py-3.5">Judul</th>
                                    <th className="px-5 py-3.5">Brand</th>
                                    <th className="px-5 py-3.5">Kategori</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Deadline</th>
                                    <th className="px-5 py-3.5">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTickets.map((ticket, i) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                                                <Hash size={11} />{ticket.ticket_number || i + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-bold max-w-[200px] truncate">{ticket.title}</td>
                                        <td className="px-5 py-4 text-muted-foreground text-xs">{ticket.brand}</td>
                                        <td className="px-5 py-4">
                                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">{ticket.category}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-medium text-xs">
                                            {new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href={`/admin/tickets/${ticket.id}`}
                                                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-primary transition-colors"
                                                    title="Detail"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                {isHeadIT && ticket.status === 'Open' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(ticket.id)}
                                                            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 text-green-600 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(ticket.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-16 text-center">
                            <Ticket size={40} className="mx-auto mb-3 text-zinc-300" />
                            <p className="font-bold">Tidak ada tiket</p>
                            <p className="text-xs text-muted-foreground mt-1">Belum ada tiket yang cocok dengan filter.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
