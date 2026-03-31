"use client";

import { useEffect, useState } from "react";
import {
    Archive,
    Search,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function DashboardArchivePage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedGroup, setExpandedGroup] = useState<string>("Completed");

    useEffect(() => {
        async function loadArchive() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("work_orders")
                .select("*")
                .eq("user_id", user.id)
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
            t.brand?.toLowerCase().includes(q)
        );
    });

    const grouped: Record<string, any[]> = {
        Completed: filtered.filter((t) => t.status === "Completed"),
        Rejected: filtered.filter((t) => t.status === "Rejected"),
    };

    const groupConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string; desc: string }> = {
        Completed: {
            icon: CheckCircle2,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-500/10",
            border: "border-green-200 dark:border-green-500/20",
            label: "Selesai",
            desc: "Tiket yang sudah selesai dikerjakan",
        },
        Rejected: {
            icon: XCircle,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-500/10",
            border: "border-red-200 dark:border-red-500/20",
            label: "Ditolak",
            desc: "Tiket yang ditolak oleh PIC IT",
        },
    };

    function toggleGroup(key: string) {
        setExpandedGroup(expandedGroup === key ? "" : key);
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            <header className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium mb-4 transition-colors"
                >
                    <ArrowLeft size={16} /> Kembali ke Dashboard
                </Link>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Archive size={24} /> Arsip Tiket Saya
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Riwayat tiket yang sudah selesai atau ditolak.
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
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
            ) : tickets.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                    <Archive size={40} className="mx-auto mb-3 text-zinc-300" />
                    <p className="font-bold">Arsip Kosong</p>
                    <p className="text-sm text-muted-foreground mt-1">Belum ada tiket yang selesai atau ditolak.</p>
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
                                    <div className="text-left">
                                        <span className={`font-bold text-sm ${config.color}`}>{config.label}</span>
                                        <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{config.desc}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border} ml-1`}>
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
                                                <div className="divide-y divide-border bg-white dark:bg-zinc-900">
                                                    {items.map((ticket, i) => (
                                                        <motion.div
                                                            key={ticket.id}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: i * 0.03 }}
                                                        >
                                                            <Link
                                                                href={`/dashboard/ticket/${ticket.id}`}
                                                                className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                                                        {ticket.title}
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <span className="text-xs text-muted-foreground">{ticket.brand}</span>
                                                                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium">
                                                                            {ticket.category}
                                                                        </span>
                                                                        {ticket.priority === "P1" && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                                                                                P1
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {new Date(ticket.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                                    </div>
                                                                </div>
                                                                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                                                            </Link>
                                                        </motion.div>
                                                    ))}
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
