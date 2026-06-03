"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    Search,
    Calendar,
    User,
    MessageSquare,
    Send,
    CheckSquare,
    Square,
    BarChart3,
    ChevronDown,
    ChevronUp,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Record<string, any>>({});
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [commentingId, setCommentingId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        const { data } = await supabase
            .from('daily_reports')
            .select(`
                *,
                work_orders (title, brand, ticket_number, category, status)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (data) {
            setReports(data);

            // Load profile names for unique user_ids
            const userIds = [...new Set(data.map((r: any) => r.user_id))];
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .in('id', userIds);

            if (profileData) {
                const map: Record<string, any> = {};
                profileData.forEach((p: any) => { map[p.id] = p; });
                setProfiles(map);
            }
        }
    }

    async function handleSubmitComment(reportId: string) {
        if (!commentText.trim()) return;
        setSubmittingComment(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('daily_reports')
            .update({
                admin_comment: commentText.trim(),
                commented_at: new Date().toISOString(),
                commented_by: user.id,
            })
            .eq('id', reportId);

        if (error) {
            alert("Gagal mengirim komentar: " + error.message);
        } else {
            setCommentingId(null);
            setCommentText("");
            await loadReports();
        }
        setSubmittingComment(false);
    }

    function toggleSelect(id: string) {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    }

    function selectAllFiltered() {
        const ids = filtered.map(r => r.id);
        const allSelected = ids.every(id => selectedIds.has(id));
        const next = new Set(selectedIds);
        if (allSelected) {
            ids.forEach(id => next.delete(id));
        } else {
            ids.forEach(id => next.add(id));
        }
        setSelectedIds(next);
    }

    function handleGenerateSummary() {
        if (selectedIds.size === 0) {
            alert("Pilih minimal 1 laporan untuk generate summary.");
            return;
        }
        // Store selected IDs in sessionStorage and navigate
        sessionStorage.setItem('summary_report_ids', JSON.stringify([...selectedIds]));
        router.push('/admin/reports/summary');
    }

    const getUserName = (userId: string) => {
        const p = profiles[userId];
        return p?.full_name || userId?.substring(0, 8) + '...';
    };

    const getRoleBadge = (userId: string) => {
        const p = profiles[userId];
        const role = p?.role || 'unknown';
        const styles: Record<string, string> = {
            designer: 'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
            it_dev: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
            it_support: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        };
        const labels: Record<string, string> = { designer: 'Designer', it_dev: 'IT Dev', it_support: 'IT Support' };
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[role] || 'bg-zinc-100 text-zinc-600'}`}>{labels[role] || role}</span>;
    };

    const filtered = reports.filter((r: any) => {
        const matchSearch = search === '' ||
            r.content?.toLowerCase().includes(search.toLowerCase()) ||
            getUserName(r.user_id).toLowerCase().includes(search.toLowerCase());
        const matchDate = dateFilter === '' ||
            r.report_date === dateFilter;
        return matchSearch && matchDate;
    });

    const allFilteredSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id));

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText size={24} /> Laporan Harian Tim
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Seluruh laporan harian dari tim. Pilih laporan untuk generate summary.
                </p>
            </header>

            {/* Filters + Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        placeholder="Cari laporan atau nama..."
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

            {/* Selection Bar */}
            <div className="flex items-center justify-between mb-4 px-1">
                <button
                    onClick={selectAllFiltered}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    {allFilteredSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                    {allFilteredSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <span className="text-xs font-bold text-primary">{selectedIds.size} dipilih</span>
                    )}
                    <button
                        onClick={handleGenerateSummary}
                        disabled={selectedIds.size === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-30"
                    >
                        <BarChart3 size={14} /> Generate Summary
                    </button>
                </div>
            </div>

            {/* Reports List */}
            <div className="space-y-3">
                {filtered.length > 0 ? (
                    filtered.map((report, i) => {
                        const isSelected = selectedIds.has(report.id);
                        const isExpanded = expandedId === report.id;

                        return (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={`bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm transition-all ${isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
                            >
                                {/* Main row */}
                                <div className="p-5 flex items-start gap-3">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleSelect(report.id)}
                                        className="mt-0.5 shrink-0"
                                    >
                                        {isSelected
                                            ? <CheckSquare size={18} className="text-primary" />
                                            : <Square size={18} className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 transition-colors" />
                                        }
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <User size={12} className="text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{getUserName(report.user_id)}</p>
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {new Date(report.report_date).toLocaleDateString('id-ID', {
                                                            weekday: 'short', day: 'numeric', month: 'short'
                                                        })}
                                                    </p>
                                                </div>
                                                {getRoleBadge(report.user_id)}
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                                                            style={{ width: `${report.progress_pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold tabular-nums">{report.progress_pct}%</span>
                                                </div>
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                                                    className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        {report.work_orders && (
                                            <div className="mb-1.5">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                                                    #{report.work_orders.ticket_number} — {report.work_orders.title}
                                                </span>
                                            </div>
                                        )}

                                        <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-2">{report.content}</p>

                                        {/* Admin Comment Preview */}
                                        {report.admin_comment && !isExpanded && (
                                            <div className="mt-2 flex items-center gap-1 text-[10px] text-violet-500 font-bold">
                                                <MessageSquare size={10} /> Sudah dikomentari
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 border-t border-border pt-4 ml-8">
                                                {/* Full content */}
                                                <div className="mb-4">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Isi Laporan Lengkap</p>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.content}</p>
                                                </div>

                                                {report.work_orders && (
                                                    <div className="mb-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 space-y-1">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Detail Tiket</p>
                                                        <p className="text-sm font-bold">#{report.work_orders.ticket_number} — {report.work_orders.title}</p>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span>Brand: {report.work_orders.brand}</span>
                                                            <span>Kategori: {report.work_orders.category}</span>
                                                            <span>Status: {report.work_orders.status}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Comment Section */}
                                                {report.admin_comment ? (
                                                    <div className="p-3 bg-violet-50 dark:bg-violet-500/5 rounded-xl border border-violet-100 dark:border-violet-500/10">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <MessageSquare size={12} className="text-violet-500" />
                                                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                                                                Komentar PIC IT
                                                            </span>
                                                            {report.commented_at && (
                                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                                    {new Date(report.commented_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-violet-900 dark:text-violet-300">{report.admin_comment}</p>
                                                    </div>
                                                ) : commentingId === report.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={commentText}
                                                            onChange={(e) => setCommentText(e.target.value)}
                                                            placeholder="Tulis komentar..."
                                                            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-violet-500/20"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSubmitComment(report.id);
                                                                if (e.key === 'Escape') { setCommentingId(null); setCommentText(""); }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleSubmitComment(report.id)}
                                                            disabled={submittingComment || !commentText.trim()}
                                                            className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {submittingComment ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                                                        </button>
                                                        <button onClick={() => { setCommentingId(null); setCommentText(""); }} className="px-3 text-sm text-muted-foreground hover:text-foreground">Batal</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => { setCommentingId(report.id); setCommentText(""); }}
                                                        className="text-xs font-medium text-violet-500 hover:text-violet-600 transition-colors flex items-center gap-1"
                                                    >
                                                        <MessageSquare size={12} /> Beri Komentar
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
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
