"use client";

import { useEffect, useState } from "react";
import {
    Archive,
    Search,
    Hash,
    Eye,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronRight,
    Calendar,
    Tag,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminArchivePage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedGroup, setExpandedGroup] = useState<string>("Completed");

    useEffect(() => {
        async function loadArchive() {
            setLoading(true);
            const { data } = await supabase
                .from("work_orders")
                .select("*")
                .in("status", ["Completed", "Rejected"])
                .order("created_at", { ascending: false });

            if (data) setTickets(data);
            setLoading(false);
        }
        loadArchive();
    }, []);

    const filtered = tickets.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            t.title?.toLowerCase().includes(q) ||
            t.brand?.toLowerCase().includes(q) ||
            String(t.ticket_number).includes(q)
        );
    });

    const grouped: Record<string, any[]> = {
        Completed: filtered.filter((t) => t.status === "Completed"),
        Rejected: filtered.filter((t) => t.status === "Rejected"),
    };

    const groupConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
        Completed: {
            icon: CheckCircle2,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-500/10",
            border: "border-green-200 dark:border-green-500/20",
            label: "Selesai",
        },
        Rejected: {
            icon: XCircle,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-500/10",
            border: "border-red-200 dark:border-red-500/20",
            label: "Ditolak",
        },
    };

    function toggleGroup(key: string) {
        setExpandedGroup(expandedGroup === key ? "" : key);
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Archive size={24} /> Arsip Tiket
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Tiket yang sudah selesai atau ditolak, dikelompokkan berdasarkan status.
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900">
                    <div className="text-2xl font-bold">{tickets.length}</div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Arsip</div>
                </div>
                <div className="p-5 rounded-2xl border border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {tickets.filter((t) => t.status === "Completed").length}
                    </div>
                    <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Selesai</div>
                </div>
                <div className="p-5 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                        {tickets.filter((t) => t.status === "Rejected").length}
                    </div>
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Ditolak</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                    placeholder="Cari tiket di arsip..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Grouped Tickets */}
            {loading ? (
                <div className="p-16 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([status, items]) => {
                        const config = groupConfig[status];
                        const Icon = config.icon;
                        const isExpanded = expandedGroup === status;

                        return (
                            <div key={status} className={`rounded-2xl border ${config.border} overflow-hidden`}>
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(status)}
                                    className={`w-full flex items-center gap-3 px-6 py-4 ${config.bg} transition-colors hover:opacity-90`}
                                >
                                    <Icon size={20} className={config.color} />
                                    <span className={`font-bold text-sm ${config.color}`}>
                                        {config.label}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                                        {items.length}
                                    </span>
                                    <div className="ml-auto">
                                        {isExpanded ? (
                                            <ChevronDown size={18} className={config.color} />
                                        ) : (
                                            <ChevronRight size={18} className={config.color} />
                                        )}
                                    </div>
                                </button>

                                {/* Group Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            {items.length > 0 ? (
                                                <div className="bg-white dark:bg-zinc-900">
                                                    <table className="w-full text-left text-sm border-collapse">
                                                        <thead>
                                                            <tr className="bg-zinc-50 dark:bg-zinc-800 text-muted-foreground font-semibold text-xs">
                                                                <th className="px-5 py-3">No.</th>
                                                                <th className="px-5 py-3">Judul</th>
                                                                <th className="px-5 py-3">Brand</th>
                                                                <th className="px-5 py-3">Kategori</th>
                                                                <th className="px-5 py-3">Deadline</th>
                                                                <th className="px-5 py-3">Tanggal Dibuat</th>
                                                                <th className="px-5 py-3">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {items.map((ticket, i) => (
                                                                <motion.tr
                                                                    key={ticket.id}
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    transition={{ delay: i * 0.02 }}
                                                                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                                                >
                                                                    <td className="px-5 py-3.5">
                                                                        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Hash size={11} />{ticket.ticket_number || "-"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3.5 font-bold max-w-[200px] truncate">{ticket.title}</td>
                                                                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{ticket.brand}</td>
                                                                    <td className="px-5 py-3.5">
                                                                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                                                                            {ticket.category}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-3.5 text-xs font-medium">
                                                                        {new Date(ticket.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                                    </td>
                                                                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                                                        {new Date(ticket.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                                    </td>
                                                                    <td className="px-5 py-3.5">
                                                                        <Link
                                                                            href={`/admin/tickets/${ticket.id}`}
                                                                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-primary transition-colors inline-flex"
                                                                            title="Detail"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </Link>
                                                                    </td>
                                                                </motion.tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center bg-white dark:bg-zinc-900">
                                                    <p className="text-xs text-muted-foreground italic">
                                                        Tidak ada tiket {config.label.toLowerCase()} yang cocok.
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
