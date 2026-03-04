export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    Search,
    Calendar,
    User,
    Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        async function loadReports() {
            let query = supabase
                .from('daily_reports')
                .select(`
                    *,
                    work_orders (title, brand, ticket_number)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            const { data } = await query;
            if (data) setReports(data);
        }
        loadReports();
    }, []);

    const filtered = reports.filter(r => {
        const matchSearch = search === '' ||
            r.content?.toLowerCase().includes(search.toLowerCase());
        const matchDate = dateFilter === '' ||
            r.report_date === dateFilter;
        return matchSearch && matchDate;
    });

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText size={24} /> Laporan Harian Tim
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Seluruh laporan harian dari tim Designer, IT Dev, dan IT Support.
                </p>
            </header>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        placeholder="Cari laporan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2.5 text-sm rounded-xl border border-border bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Reports List */}
            <div className="space-y-3">
                {filtered.length > 0 ? (
                    filtered.map((report, i) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <User size={14} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{report.user_id?.substring(0, 8)}...</p>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(report.report_date).toLocaleDateString('id-ID', {
                                                weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                                            style={{ width: `${report.progress_pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold tabular-nums">{report.progress_pct}%</span>
                                </div>
                            </div>

                            {report.work_orders && (
                                <div className="mb-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                                        #{report.work_orders.ticket_number} — {report.work_orders.title}
                                    </span>
                                </div>
                            )}

                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.content}</p>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-16 text-center">
                        <FileText size={40} className="mx-auto mb-3 text-zinc-300" />
                        <p className="font-bold">Belum ada laporan</p>
                        <p className="text-xs text-muted-foreground mt-1">Tim belum mengirim laporan harian.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
