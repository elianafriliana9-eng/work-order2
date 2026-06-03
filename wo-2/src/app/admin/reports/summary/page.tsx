"use client";

import { useEffect, useState, useRef } from "react";
import {
    FileText,
    ArrowLeft,
    Printer,
    Download,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { generateReportPDF } from "./generateReportPDF";


export default function ReportSummaryPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

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

    const summaryText = `Pada tanggal ${new Date(reportDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, terdapat ${reports.length} laporan harian dari ${uniqueMembers.length} anggota tim. Rata-rata progress keseluruhan adalah ${avgProgress}%. Berikut adalah rincian detail laporan pekerjaan harian tim IT.`;

    const generatedAt = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await generateReportPDF({
                reportDate,
                avgProgress,
                reports,
                uniqueMembers,
                tickets,
                memberProgress,
                roleLabels,
                summaryText,
                profiles
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

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

                    .print-only { display: block !important; }

                    /* Reset main layout padding from AdminSidebar to prevent squeezing */
                    main, .lg\\:pl-64 {
                        padding-left: 0 !important;
                        margin-left: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        background: white !important;
                        transform: none !important;
                    }

                    .print-doc {
                        padding: 0 5mm !important;
                        margin: 0 auto !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        background: white !important;
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
                        background: white !important;
                    }

                    /* Fix chart overflows in Recharts during print */
                    .recharts-wrapper {
                        margin: 0 auto !important;
                    }
                    .recharts-surface {
                        overflow: visible !important;
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
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {isExporting ? <span className="animate-spin w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full" /> : <Download size={14} />}
                        {isExporting ? 'Memproses PDF...' : 'Download PDF'}
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



                {/* Section 5: Individual Reports */}
                <div className="print-break-before mt-8">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-border pb-2">
                        <span className="w-1 h-4 bg-green-500 rounded-full inline-block" />
                        LAMPIRAN — DETAIL LAPORAN HARIAN ({reports.length})
                    </h2>
                    <div className="space-y-4">
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
                        <p className="text-xs border-t border-zinc-400 pt-1">PIC IT</p>
                    </div>
                </div>
            </div>
        </>
    );
}
