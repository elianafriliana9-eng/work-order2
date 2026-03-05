"use client";

import { useEffect, useState, useRef } from "react";
import {
    FileText,
    ArrowLeft,
    Printer,
    BarChart3,
    TrendingUp,
    Users,
    Calendar,
    CheckCircle2,
    Clock,
    Ticket,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from "recharts";
import { supabase } from "@/lib/supabase";

const COLORS = ['#8b5cf6', '#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function ReportSummaryPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Record<string, any>>({});
    const [allTickets, setAllTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSummaryData();
    }, []);

    async function loadSummaryData() {
        try {
            // Get selected report IDs from sessionStorage
            const storedIds = sessionStorage.getItem('summary_report_ids');
            if (!storedIds) {
                setLoading(false);
                return;
            }

            const selectedIds: string[] = JSON.parse(storedIds);

            // Fetch selected reports
            const { data: reportData } = await supabase
                .from('daily_reports')
                .select(`*, work_orders (id, title, brand, ticket_number, category, status, priority, deadline, created_at)`)
                .in('id', selectedIds)
                .order('report_date', { ascending: false });

            if (reportData) {
                setReports(reportData);

                // Extract unique tickets
                const ticketMap = new Map();
                reportData.forEach((r: any) => {
                    if (r.work_orders) ticketMap.set(r.work_orders.id, r.work_orders);
                });
                setTickets([...ticketMap.values()]);

                // Load profile names
                const userIds = [...new Set(reportData.map((r: any) => r.user_id))];
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

            // Fetch all tickets for frequency chart
            const { data: allTicketData } = await supabase
                .from('work_orders')
                .select('id, category, status, created_at, brand')
                .order('created_at', { ascending: true });

            if (allTicketData) setAllTickets(allTicketData);

            setLoading(false);
        } catch (err) {
            console.error("Summary load error:", err);
            setLoading(false);
        }
    }

    function handlePrint() {
        window.print();
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold animate-pulse">Generating summary...</p>
                </div>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="p-10 text-center">
                <FileText size={48} className="mx-auto mb-4 text-zinc-300" />
                <h2 className="text-xl font-bold mb-2">Tidak ada data</h2>
                <p className="text-sm text-muted-foreground mb-4">Kembali dan pilih laporan untuk di-generate.</p>
                <Link href="/admin/reports" className="text-sm text-primary hover:underline">← Kembali</Link>
            </div>
        );
    }

    // --- Data Processing ---
    const reportDate = reports[0]?.report_date;
    const avgProgress = Math.round(reports.reduce((sum, r) => sum + (r.progress_pct || 0), 0) / reports.length);
    const uniqueMembers = [...new Set(reports.map(r => r.user_id))];

    // Progress per member
    const memberProgress = uniqueMembers.map(uid => {
        const userReports = reports.filter(r => r.user_id === uid);
        const avg = Math.round(userReports.reduce((s, r) => s + (r.progress_pct || 0), 0) / userReports.length);
        const name = profiles[uid]?.full_name || uid.substring(0, 8);
        const role = profiles[uid]?.role || 'unknown';
        return { name, avg, role, reports: userReports.length };
    });

    // Category breakdown from tickets
    const categoryCount: Record<string, number> = {};
    tickets.forEach(t => {
        categoryCount[t.category || 'Lainnya'] = (categoryCount[t.category || 'Lainnya'] || 0) + 1;
    });
    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    // Status breakdown
    const statusCount: Record<string, number> = {};
    tickets.forEach(t => {
        statusCount[t.status || 'Unknown'] = (statusCount[t.status || 'Unknown'] || 0) + 1;
    });
    const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

    // Monthly frequency (from all tickets)
    const monthlyFreq: Record<string, number> = {};
    allTickets.forEach(t => {
        const month = new Date(t.created_at).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        monthlyFreq[month] = (monthlyFreq[month] || 0) + 1;
    });
    const frequencyData = Object.entries(monthlyFreq).map(([name, count]) => ({ name, count }));

    // Category frequency (from all tickets)
    const catFreq: Record<string, number> = {};
    allTickets.forEach(t => {
        catFreq[t.category || 'Lainnya'] = (catFreq[t.category || 'Lainnya'] || 0) + 1;
    });
    const catFreqData = Object.entries(catFreq).map(([name, count]) => ({ name, count }));

    // Auto summary text
    const summaryText = `Pada tanggal ${new Date(reportDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, terdapat ${reports.length} laporan harian dari ${uniqueMembers.length} anggota tim. Rata-rata progress keseluruhan adalah ${avgProgress}%. ${tickets.length > 0 ? `Terdapat ${tickets.length} project/tiket yang sedang dikerjakan, meliputi kategori ${Object.keys(categoryCount).join(', ')}.` : 'Tidak ada tiket terkait yang dilaporkan.'} ${memberProgress.filter(m => m.avg >= 80).length > 0 ? `${memberProgress.filter(m => m.avg >= 80).map(m => m.name).join(', ')} menunjukkan progress di atas 80%.` : ''} Total tiket yang masuk sejak awal hingga saat ini adalah ${allTickets.length} tiket.`;

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-break { page-break-before: always; }
                }
            `}</style>

            <div className="p-6 md:p-10 max-w-7xl mx-auto" ref={printRef}>
                {/* Back + Print */}
                <div className="flex items-center justify-between mb-8 no-print">
                    <Link href="/admin/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Kembali ke Laporan
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-all"
                    >
                        <Printer size={14} /> Print / Export PDF
                    </button>
                </div>

                {/* Header */}
                <header className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 rounded-full text-xs font-bold mb-3">
                        <BarChart3 size={12} /> Laporan Ringkasan
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold">Summary Report — Tim IT</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {new Date(reportDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {' '}• {reports.length} laporan dari {uniqueMembers.length} anggota
                    </p>
                </header>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Laporan', value: reports.length, icon: FileText, color: 'text-violet-500' },
                        { label: 'Anggota Tim', value: uniqueMembers.length, icon: Users, color: 'text-blue-500' },
                        { label: 'Rata-rata Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-green-500' },
                        { label: 'Project Aktif', value: tickets.length, icon: Ticket, color: 'text-amber-500' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-sm"
                        >
                            <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 ${stat.color} w-fit mb-3`}>
                                <stat.icon size={18} />
                            </div>
                            <p className="text-2xl font-black tabular-nums">{stat.value}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Auto Summary */}
                <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10 rounded-2xl p-6 mb-8">
                    <h2 className="font-bold text-sm flex items-center gap-2 mb-3 text-violet-700 dark:text-violet-400">
                        <FileText size={16} /> Ringkasan Otomatis
                    </h2>
                    <p className="text-sm leading-relaxed text-violet-900 dark:text-violet-300">{summaryText}</p>
                </div>

                {/* Charts Row 1: Progress per Member + Category Pie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Progress per Member */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-6">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                            <TrendingUp size={14} /> Progress per Anggota
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={memberProgress} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                    <Bar dataKey="avg" name="Progress %" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Pie */}
                    {categoryData.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-6">
                            <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                                <BarChart3 size={14} /> Distribusi Kategori Project
                            </h3>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            innerRadius={50}
                                            paddingAngle={3}
                                            label={({ name, value }) => `${name} (${value})`}
                                        >
                                            {categoryData.map((_, idx) => (
                                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Charts Row 2: Monthly Frequency + Category Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print-break">
                    {/* Monthly Ticket Frequency */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-6">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                            <Calendar size={14} /> Frekuensi Tiket per Bulan
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={frequencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="count" name="Tiket Masuk" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Frequency Bar */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-6">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                            <Ticket size={14} /> Total Tiket per Kategori
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={catFreqData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                    <Bar dataKey="count" name="Total" fill="#f472b6" radius={[0, 6, 6, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Project Details */}
                {tickets.length > 0 && (
                    <div className="mb-8">
                        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                            <Ticket size={18} /> Detail Project ({tickets.length})
                        </h2>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-xs uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold">#</th>
                                            <th className="px-4 py-3 text-left font-bold">Project</th>
                                            <th className="px-4 py-3 text-left font-bold">Kategori</th>
                                            <th className="px-4 py-3 text-left font-bold">Brand</th>
                                            <th className="px-4 py-3 text-left font-bold">Status</th>
                                            <th className="px-4 py-3 text-left font-bold">Prioritas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {tickets.map((t, i) => (
                                            <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.ticket_number}</td>
                                                <td className="px-4 py-3 font-bold">{t.title}</td>
                                                <td className="px-4 py-3">{t.category}</td>
                                                <td className="px-4 py-3">{t.brand}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : t.status === 'Execution' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.priority === 'P1' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                                        {t.priority}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Individual Reports */}
                <div className="print-break">
                    <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                        <FileText size={18} /> Detail Laporan ({reports.length})
                    </h2>
                    <div className="space-y-3">
                        {reports.map((report, i) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-5"
                            >
                                <div className="flex items-center justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <Users size={14} className="text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">{profiles[report.user_id]?.full_name || report.user_id?.substring(0, 8)}</p>
                                            <p className="text-[10px] text-muted-foreground">{profiles[report.user_id]?.role || ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${report.progress_pct}%` }} />
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
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-xs text-muted-foreground border-t border-border pt-6">
                    <p>Summary Report di-generate otomatis oleh Work Order System</p>
                    <p className="mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
        </>
    );
}
