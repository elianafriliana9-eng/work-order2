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
    Download,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";
import { supabase } from "@/lib/supabase";

const COLORS = ['#8b5cf6', '#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function ReportSummaryPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Record<string, any>>({});
    const [allTickets, setAllTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummaryData();
    }, []);

    async function loadSummaryData() {
        try {
            const storedIds = sessionStorage.getItem('summary_report_ids');
            if (!storedIds) { setLoading(false); return; }

            const selectedIds: string[] = JSON.parse(storedIds);

            const { data: reportData } = await supabase
                .from('daily_reports')
                .select(`*, work_orders (id, title, brand, ticket_number, category, status, priority, deadline, created_at)`)
                .in('id', selectedIds)
                .order('report_date', { ascending: false });

            if (reportData) {
                setReports(reportData);
                const ticketMap = new Map();
                reportData.forEach((r: any) => {
                    if (r.work_orders) ticketMap.set(r.work_orders.id, r.work_orders);
                });
                setTickets([...ticketMap.values()]);

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

    const memberProgress = uniqueMembers.map(uid => {
        const userReports = reports.filter(r => r.user_id === uid);
        const avg = Math.round(userReports.reduce((s, r) => s + (r.progress_pct || 0), 0) / userReports.length);
        const name = profiles[uid]?.full_name || uid.substring(0, 8);
        const role = profiles[uid]?.role || 'unknown';
        return { name, avg, role, reports: userReports.length };
    });

    const roleLabels: Record<string, string> = { designer: 'Designer', it_dev: 'IT Dev', it_support: 'IT Support' };

    const categoryCount: Record<string, number> = {};
    tickets.forEach(t => { categoryCount[t.category || 'Lainnya'] = (categoryCount[t.category || 'Lainnya'] || 0) + 1; });
    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    const monthlyFreq: Record<string, number> = {};
    allTickets.forEach(t => {
        const month = new Date(t.created_at).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        monthlyFreq[month] = (monthlyFreq[month] || 0) + 1;
    });
    const frequencyData = Object.entries(monthlyFreq).map(([name, count]) => ({ name, count }));

    const catFreq: Record<string, number> = {};
    allTickets.forEach(t => { catFreq[t.category || 'Lainnya'] = (catFreq[t.category || 'Lainnya'] || 0) + 1; });
    const catFreqData = Object.entries(catFreq).map(([name, count]) => ({ name, count }));

    const summaryText = `Pada tanggal ${new Date(reportDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, terdapat ${reports.length} laporan harian dari ${uniqueMembers.length} anggota tim. Rata-rata progress keseluruhan adalah ${avgProgress}%. ${tickets.length > 0 ? `Terdapat ${tickets.length} project/tiket yang sedang dikerjakan, meliputi kategori ${Object.keys(categoryCount).join(', ')}.` : 'Tidak ada tiket terkait yang dilaporkan.'} ${memberProgress.filter(m => m.avg >= 80).length > 0 ? `${memberProgress.filter(m => m.avg >= 80).map(m => m.name).join(', ')} menunjukkan progress di atas 80%.` : ''} Total tiket yang masuk sejak awal hingga saat ini adalah ${allTickets.length} tiket.`;

    const generatedAt = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <>
            {/* Print-Optimized Styles */}
            <style jsx global>{`
                @media print {
                    /* Basic resets for accurate printing */
                    *, *::before, *::after {
                        box-sizing: border-box !important;
                    }

                    /* Hide web UI elements */
                    .no-print, nav, aside, header.app-header { display: none !important; }

                    /* Reset main layout padding from AdminSidebar to prevent squeezing */
                    main {
                        padding-left: 0 !important;
                        margin-left: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }

                    .print-doc {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        width: 100% !important;
                    }

                    /* Reset page */
                    html, body {
                        background: white !important;
                        color: #111 !important;
                        font-size: 11pt !important;
                        line-height: 1.5 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }

                    /* Page setup for precise A4 print */
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }

                    /* Important to stop body from shrinking or shifting */
                    #__next, body > div {
                        display: block !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    /* Fix chart overflows in Recharts during print */
                    .recharts-responsive-container {
                        width: 100% !important;
                        min-width: 100% !important;
                    }
                    .recharts-wrapper {
                        width: 100% !important;
                        margin: 0 auto !important;
                    }

                    table {
                        width: 100% !important;
                        table-layout: fixed !important;
                    }
                    th, td {
                        word-wrap: break-word !important;
                    }

                    /* Document header */
                    .doc-header {
                        border-bottom: 3px solid #111 !important;
                        padding-bottom: 12pt !important;
                        margin-bottom: 16pt !important;
                    }

                    /* Remove rounded corners, shadows for cleaner doc */
                    .doc-card {
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        border: 1px solid #ddd !important;
                        background: white !important;
                        break-inside: avoid;
                    }

                    .doc-stat {
                        border: 1px solid #ddd !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                    }

                    /* Summary box */
                    .doc-summary {
                        background: #f9f5ff !important;
                        border: 1px solid #c4b5fd !important;
                        border-radius: 0 !important;
                    }

                    /* Chart containers */
                    .doc-chart {
                        break-inside: avoid;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        border: 1px solid #ddd !important;
                    }

                    /* Tables */
                    .doc-table {
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    .doc-table table { border-collapse: collapse !important; }
                    .doc-table th, .doc-table td { border: 1px solid #ddd !important; padding: 6pt 8pt !important; }
                    .doc-table thead { background: #f5f5f5 !important; }

                    /* Report items */
                    .doc-report-item {
                        border: 1px solid #ddd !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                    }

                    /* Page breaks */
                    .print-break-before { page-break-before: always; }
                    .print-break-avoid { break-inside: avoid; }

                    /* Footer */
                    .doc-footer {
                        border-top: 2px solid #111 !important;
                        margin-top: 16pt !important;
                        padding-top: 8pt !important;
                    }

                    /* Progress bars in print */
                    .progress-fill { -webkit-print-color-adjust: exact !important; }
                }
            `}</style>

            {/* Web toolbar */}
            <div className="no-print p-6 md:p-10 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/admin/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Kembali ke Laporan
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-all"
                    >
                        <Download size={14} /> Export PDF
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">Preview di bawah ini akan terformat sebagai dokumen profesional saat di-export ke PDF.</p>
            </div>

            {/* === Printable Document === */}
            <div className="print-doc p-6 md:px-10 md:pb-10 max-w-7xl mx-auto">

                {/* Document Letterhead */}
                <div className="doc-header border-b-2 border-zinc-900 dark:border-zinc-100 pb-4 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">LAPORAN RINGKASAN TIM IT</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Summary Report — Work Order System</p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-bold">
                                {new Date(reportDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-muted-foreground">Digenerate: {generatedAt}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total Laporan', value: reports.length },
                        { label: 'Anggota Tim', value: uniqueMembers.length },
                        { label: 'Rata-rata Progress', value: `${avgProgress}%` },
                        { label: 'Project Aktif', value: tickets.length },
                    ].map((stat, i) => (
                        <div key={stat.label} className="doc-stat p-4 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm text-center">
                            <p className="text-2xl font-black tabular-nums">{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Section 1: Ringkasan */}
                <div className="mb-6">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <span className="w-1 h-4 bg-violet-500 rounded-full inline-block" />
                        RINGKASAN EKSEKUTIF
                    </h2>
                    <div className="doc-summary bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/10 rounded-xl p-5">
                        <p className="text-sm leading-relaxed">{summaryText}</p>
                    </div>
                </div>

                {/* Section 2: Anggota Tim */}
                <div className="mb-6">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
                        PROGRESS ANGGOTA TIM
                    </h2>
                    <div className="doc-table bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm overflow-hidden mb-4">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nama</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Laporan</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground w-40">Bar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {memberProgress.map((m, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2.5 font-bold">{m.name}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{roleLabels[m.role] || m.role}</td>
                                        <td className="px-4 py-2.5 tabular-nums">{m.reports}</td>
                                        <td className="px-4 py-2.5 font-bold tabular-nums">{m.avg}%</td>
                                        <td className="px-4 py-2.5">
                                            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                <div className="progress-fill h-full rounded-full bg-violet-500" style={{ width: `${m.avg}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Progress Bar Chart */}
                    <div className="doc-chart bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm p-5">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Grafik Progress per Anggota</h3>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={memberProgress} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }} />
                                    <Bar dataKey="avg" name="Progress %" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Section 3: Project Detail */}
                {tickets.length > 0 && (
                    <div className="mb-6 print-break-avoid">
                        <h2 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-border pb-2">
                            <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
                            DETAIL PROJECT ({tickets.length})
                        </h2>
                        <div className="doc-table bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">No. Tiket</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Project</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kategori</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brand</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioritas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tickets.map((t) => (
                                        <tr key={t.id}>
                                            <td className="px-4 py-2.5 font-mono text-xs">{t.ticket_number}</td>
                                            <td className="px-4 py-2.5 font-bold">{t.title}</td>
                                            <td className="px-4 py-2.5">{t.category}</td>
                                            <td className="px-4 py-2.5">{t.brand}</td>
                                            <td className="px-4 py-2.5">{t.status}</td>
                                            <td className="px-4 py-2.5">{t.priority}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Section 4: Charts - Frequency & Distribution */}
                <div className="mb-6 print-break-before">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <span className="w-1 h-4 bg-pink-500 rounded-full inline-block" />
                        STATISTIK & ANALISIS
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Monthly Frequency */}
                        <div className="doc-chart bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm p-5">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Frekuensi Tiket per Bulan</h3>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={frequencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }} />
                                        <Area type="monotone" dataKey="count" name="Tiket Masuk" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Pie */}
                        {categoryData.length > 0 && (
                            <div className="doc-chart bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm p-5">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Distribusi Kategori</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name} (${value})`}>
                                                {categoryData.map((_, idx) => (
                                                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Category Frequency Bar */}
                        <div className="doc-chart bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm p-5">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Total Tiket per Kategori</h3>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={catFreqData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                        <XAxis type="number" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} width={70} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }} />
                                        <Bar dataKey="count" name="Total" fill="#f472b6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status summary text */}
                        <div className="doc-chart bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm p-5">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Ringkasan Status Tiket</h3>
                            <div className="space-y-3 mt-2">
                                {Object.entries(catFreq).map(([cat, count]) => (
                                    <div key={cat} className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{cat}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                <div className="progress-fill h-full rounded-full bg-pink-500" style={{ width: `${(count / allTickets.length) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold tabular-nums w-12 text-right">{count} tiket</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-border flex items-center justify-between">
                                    <span className="text-sm font-bold">Total</span>
                                    <span className="text-sm font-black tabular-nums">{allTickets.length} tiket</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 5: Individual Reports */}
                <div className="print-break-before">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <span className="w-1 h-4 bg-green-500 rounded-full inline-block" />
                        LAMPIRAN — DETAIL LAPORAN HARIAN ({reports.length})
                    </h2>
                    <div className="space-y-3">
                        {reports.map((report, i) => (
                            <div key={report.id} className="doc-report-item bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm p-4">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <div>
                                        <span className="text-xs font-bold">{profiles[report.user_id]?.full_name || report.user_id?.substring(0, 8)}</span>
                                        <span className="text-[10px] text-muted-foreground ml-2">{roleLabels[profiles[report.user_id]?.role] || ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <div className="progress-fill h-full rounded-full bg-violet-500" style={{ width: `${report.progress_pct}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold tabular-nums">{report.progress_pct}%</span>
                                    </div>
                                </div>
                                {report.work_orders && (
                                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                                        Tiket #{report.work_orders.ticket_number} — {report.work_orders.title} ({report.work_orders.brand})
                                    </p>
                                )}
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{report.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Document Footer */}
                <div className="doc-footer mt-10 border-t-2 border-zinc-900 dark:border-zinc-100 pt-4 flex items-end justify-between print-break-avoid">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Dokumen ini digenerate otomatis</p>
                        <p className="text-[10px] text-muted-foreground">Work Order System — {generatedAt}</p>
                    </div>
                    <div className="text-center w-48">
                        <p className="text-xs font-bold mb-12">Mengetahui,</p>
                        <p className="text-xs border-t border-zinc-400 pt-1">Head of IT</p>
                    </div>
                </div>
            </div>
        </>
    );
}
