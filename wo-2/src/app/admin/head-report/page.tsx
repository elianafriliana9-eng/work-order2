"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";
import {
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowUpDown,
    Search,
    Filter,
    Download,
    Calendar,
    Zap,
    Layers,
    Timer,
    Target,
    Brain,
    ChevronDown,
    ChevronUp,
    FileText,
    Activity,
    Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

// ===================== TYPES =====================
interface WorkOrder {
    id: string;
    title: string;
    brand: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    deadline: string;
    description: string;
    revision_count: number;
    task_type: string | null;
    platform: string | null;
    module_affected: string | null;
    reproduction_steps: string | null;
    user_flow: string | null;
    meeting_type: string | null;
    completed_at?: string | null;
    updated_at?: string | null;
    urgent_reason?: string | null;
}

interface ComplexityResult {
    score: number;
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    factors: string[];
    color: string;
    bgColor: string;
}

// ===================== COMPLEXITY ENGINE =====================
function detectComplexity(wo: WorkOrder): ComplexityResult {
    let score = 0;
    const factors: string[] = [];

    // 1. Category weight
    if (wo.category === 'Programming') {
        score += 3;
        factors.push('Kategori: Programming');
    } else if (wo.category === 'Design') {
        score += 1.5;
        factors.push('Kategori: Design');
    } else if (wo.category === 'Asset') {
        score += 1;
        factors.push('Kategori: Asset');
    }

    // 2. Task type weight (programming)
    if (wo.task_type === 'Develop New System') {
        score += 4;
        factors.push('Tipe: Develop New System');
    } else if (wo.task_type === 'New Feature') {
        score += 3;
        factors.push('Tipe: New Feature');
    } else if (wo.task_type === 'Bug Fix') {
        score += 2;
        factors.push('Tipe: Bug Fix');
    } else if (wo.task_type === 'Maintenance') {
        score += 1;
        factors.push('Tipe: Maintenance');
    }

    // 3. Description length (longer = more complex)
    const descLen = wo.description?.length || 0;
    if (descLen > 500) {
        score += 2;
        factors.push('Deskripsi sangat panjang (>500 char)');
    } else if (descLen > 200) {
        score += 1;
        factors.push('Deskripsi cukup detail');
    }

    // 4. Priority
    if (wo.priority === 'P1') {
        score += 2;
        factors.push('Prioritas: P1 (Urgent)');
    }

    // 5. Has revisions
    if (wo.revision_count && wo.revision_count > 0) {
        score += wo.revision_count * 0.5;
        factors.push(`${wo.revision_count} revisi tercatat`);
    }

    // 6. Deadline pressure (tight deadline)
    if (wo.created_at && wo.deadline) {
        const created = new Date(wo.created_at).getTime();
        const deadline = new Date(wo.deadline).getTime();
        const daysDiff = (deadline - created) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 1) {
            score += 3;
            factors.push('Deadline sangat ketat (≤1 hari)');
        } else if (daysDiff <= 3) {
            score += 2;
            factors.push('Deadline ketat (≤3 hari)');
        } else if (daysDiff <= 7) {
            score += 1;
            factors.push('Deadline moderat (≤7 hari)');
        }
    }

    // 7. Has reproduction steps or user flow (indicates complexity)
    if (wo.reproduction_steps && wo.reproduction_steps.length > 50) {
        score += 1;
        factors.push('Ada langkah reproduksi bug');
    }
    if (wo.user_flow && wo.user_flow.length > 50) {
        score += 1.5;
        factors.push('Ada user flow definition');
    }

    // 8. Multiple modules affected
    if (wo.module_affected && wo.module_affected.includes(',')) {
        score += 1.5;
        factors.push('Multi-modul terpengaruh');
    }

    // 9. Video/Vidio keyword check
    const textToCheck = `${wo.title} ${wo.description}`.toLowerCase();
    if (textToCheck.includes('video') || textToCheck.includes('vidio')) {
        if (score < 7) score = 7;
        factors.push('Mengandung kata Video/Vidio (Otomatis High/Critical)');
    }

    // Classify
    if (score >= 10) return { score, level: 'Critical', factors, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' };
    if (score >= 7) return { score, level: 'High', factors, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' };
    if (score >= 4) return { score, level: 'Medium', factors, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' };
    return { score, level: 'Low', factors, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' };
}

// ===================== HELPER FUNCTIONS =====================
function daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// ===================== MAIN COMPONENT =====================
export default function HeadOfITReportPage() {
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [complexityFilter, setComplexityFilter] = useState('all');
    const [sortField, setSortField] = useState<string>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d' | '6m' | '1y'>('all');
    const [isExporting, setIsExporting] = useState(false);
    const chartsRef = useRef<HTMLDivElement>(null);

    // Fetch all orders
    useEffect(() => {
        async function fetchAll() {
            const { data, error } = await supabase
                .from('work_orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setOrders(data as WorkOrder[]);
            setLoading(false);
        }
        fetchAll();
    }, []);

    // ===================== COMPUTED STATS =====================
    const stats = useMemo(() => {
        if (orders.length === 0) return null;

        // Date filter
        let filtered = orders;
        if (dateRange !== 'all') {
            const now = Date.now();
            const ms = {
                '7d': 7 * 86400000,
                '30d': 30 * 86400000,
                '90d': 90 * 86400000,
                '6m': 180 * 86400000,
                '1y': 365 * 86400000,
            }[dateRange] || 0;
            filtered = orders.filter(o => (now - new Date(o.created_at).getTime()) <= ms);
        }

        const total = filtered.length;
        const active = filtered.filter(o => !['Completed', 'Rejected'].includes(o.status));
        const completed = filtered.filter(o => o.status === 'Completed');
        const rejected = filtered.filter(o => o.status === 'Rejected');
        const p1 = filtered.filter(o => o.priority === 'P1');

        // Average deadline distance (created_at -> deadline)
        const withDeadline = filtered.filter(o => o.deadline);
        let avgDeadlineDays = 0;
        if (withDeadline.length > 0) {
            const totalDays = withDeadline.reduce((sum, o) => sum + daysBetween(o.created_at, o.deadline), 0);
            avgDeadlineDays = totalDays / withDeadline.length;
        }

        // Top 3 P1 Urgent Reasons
        const p1ReasonsMap = p1.reduce((acc: Record<string, number>, o) => {
            if (o.urgent_reason && o.urgent_reason.trim() !== '') {
                const reason = o.urgent_reason.trim();
                acc[reason] = (acc[reason] || 0) + 1;
            }
            return acc;
        }, {});
        
        const topP1Reasons = Object.entries(p1ReasonsMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([reason, count]) => ({ reason, count }));

        // Complexity distribution
        const complexities = filtered.map(o => detectComplexity(o));
        const complexityDist = {
            Low: complexities.filter(c => c.level === 'Low').length,
            Medium: complexities.filter(c => c.level === 'Medium').length,
            High: complexities.filter(c => c.level === 'High').length,
            Critical: complexities.filter(c => c.level === 'Critical').length,
        };

        // Category distribution
        const categoryDist = filtered.reduce((acc: Record<string, number>, o) => {
            acc[o.category] = (acc[o.category] || 0) + 1;
            return acc;
        }, {});

        // Status distribution
        const statusDist = filtered.reduce((acc: Record<string, number>, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
        }, {});

        // Monthly trend
        const monthlyTrend = filtered.reduce((acc: Record<string, number>, o) => {
            const month = new Date(o.created_at).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});

        // Conclusion Analytics
        const sopViolations = filtered.filter(o => o.deadline && daysBetween(o.created_at, o.deadline) <= 2);
        const sopViolationRate = total > 0 ? Math.round((sopViolations.length / total) * 100) : 0;
        
        let avgViolationCompletionDays = 0;
        const completedViolations = sopViolations.filter(o => o.status === 'Completed' || o.completed_at);
        if (completedViolations.length > 0) {
            const completionDays = completedViolations.map(o => daysBetween(o.created_at, o.completed_at || o.updated_at || o.created_at));
            avgViolationCompletionDays = completionDays.reduce((a, b) => a + b, 0) / completionDays.length;
        }

        const uncoordinatedRevisions = completedViolations.filter(o => o.revision_count === 0 && daysBetween(o.created_at, o.completed_at || o.updated_at || o.created_at) > 5);

        return {
            total,
            activeCount: active.length,
            completedCount: completed.length,
            rejectedCount: rejected.length,
            p1Count: p1.length,
            avgDeadlineDays: Math.round(avgDeadlineDays * 10) / 10,
            topP1Reasons,
            resolutionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
            complexityDist,
            categoryDist,
            statusDist,
            monthlyTrend,
            filtered,
            sopViolationsCount: sopViolations.length,
            sopViolationRate,
            avgViolationCompletionDays: Math.round(avgViolationCompletionDays * 10) / 10,
            uncoordinatedRevisionsCount: uncoordinatedRevisions.length
        };
    }, [orders, dateRange]);

    // ===================== FILTERED & SORTED TABLE =====================
    const tableData = useMemo(() => {
        if (!stats) return [];
        let data = stats.filtered;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(o =>
                o.title.toLowerCase().includes(q) ||
                o.brand.toLowerCase().includes(q) ||
                (o.description || '').toLowerCase().includes(q)
            );
        }

        if (categoryFilter !== 'all') data = data.filter(o => o.category === categoryFilter);
        if (statusFilter !== 'all') data = data.filter(o => o.status === statusFilter);
        if (complexityFilter !== 'all') {
            data = data.filter(o => detectComplexity(o).level === complexityFilter);
        }

        // Sort
        data = [...data].sort((a: any, b: any) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (sortField === 'complexity') {
                valA = detectComplexity(a).score;
                valB = detectComplexity(b).score;
            }
            if (typeof valA === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDir === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });

        return data;
    }, [stats, searchQuery, categoryFilter, statusFilter, complexityFilter, sortField, sortDir]);

    // ===================== EXPORT EXCEL (XLSX) =====================
    async function exportXLSX() {
        if (tableData.length === 0) return;
        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('PIC IT Report');

            // Set columns
            sheet.columns = [
                { header: 'No', key: 'no', width: 5 },
                { header: 'Judul', key: 'title', width: 30 },
                { header: 'Brand', key: 'brand', width: 15 },
                { header: 'Kategori', key: 'category', width: 15 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Prioritas', key: 'priority', width: 10 },
                { header: 'Kompleksitas', key: 'complexity', width: 15 },
                { header: 'Skor', key: 'score', width: 10 },
                { header: 'Dibuat', key: 'created', width: 15 },
                { header: 'Deadline', key: 'deadline', width: 15 },
                { header: 'Jarak (Hari)', key: 'distance', width: 15 },
                { header: 'Revisi', key: 'revisions', width: 10 },
            ];

            // Make headers bold
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };

            // Add table data
            tableData.forEach((o, index) => {
                const c = detectComplexity(o);
                sheet.addRow({
                    no: index + 1,
                    title: o.title,
                    brand: o.brand,
                    category: o.category,
                    status: o.status,
                    priority: o.priority,
                    complexity: c.level,
                    score: c.score.toFixed(1),
                    created: formatDate(o.created_at),
                    deadline: o.deadline ? formatDate(o.deadline) : '-',
                    distance: o.deadline ? daysBetween(o.created_at, o.deadline) : '-',
                    revisions: o.revision_count || 0
                });
            });

            // Add Charts via html-to-image
            if (chartsRef.current) {
                const imgData = await toPng(chartsRef.current, { backgroundColor: '#ffffff', pixelRatio: 1.5 });
                const imageId = workbook.addImage({
                    base64: imgData,
                    extension: 'png',
                });
                
                const lastRow = sheet.lastRow ? sheet.lastRow.number : 1;
                // Calculate dimensions for excel (approximate)
                // get original width/height from DOM to maintain aspect ratio
                const { offsetWidth, offsetHeight } = chartsRef.current;
                const excelWidth = 900;
                const excelHeight = offsetWidth ? (offsetHeight * excelWidth) / offsetWidth : 400;

                sheet.addImage(imageId, {
                    tl: { col: 0, row: lastRow + 2 },
                    ext: { width: excelWidth, height: excelHeight } 
                });
            }

            // Save file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Head_IT_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export XLSX:', error);
            alert('Gagal export data Excel');
        } finally {
            setIsExporting(false);
        }
    }

    // ===================== EXPORT PDF =====================
    async function exportPDF() {
        if (tableData.length === 0) return;
        setIsExporting(true);
        try {
            const pdf = new jsPDF('l', 'pt', 'a4'); // landscape
            
            pdf.setFontSize(18);
            pdf.text('Laporan Kinerja PIC IT', 40, 40);
            pdf.setFontSize(10);
            pdf.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 40, 55);

            // Add Charts via html-to-image
            let chartHeight = 0;
            if (chartsRef.current) {
                const imgData = await toPng(chartsRef.current, { backgroundColor: '#ffffff', pixelRatio: 1.5 });
                const { offsetWidth, offsetHeight } = chartsRef.current;
                const pdfWidth = pdf.internal.pageSize.getWidth() - 80;
                const pdfHeight = offsetWidth ? (offsetHeight * pdfWidth) / offsetWidth : 300;
                pdf.addImage(imgData, 'PNG', 40, 70, pdfWidth, pdfHeight);
                chartHeight = pdfHeight + 40; // Add margin after chart
            }

            // Check if we need a new page for the table
            const pageHeight = pdf.internal.pageSize.getHeight();
            let tableStartY = 70 + chartHeight;
            if (tableStartY > pageHeight - 100) {
                pdf.addPage();
                tableStartY = 40;
            }

            // Add Table using jspdf-autotable
            const tableCols = ['No', 'Judul', 'Brand', 'Kategori', 'Status', 'Prior.', 'Komp.', 'Dibuat', 'Deadline'];
            const tableRows = tableData.map((o, index) => {
                const c = detectComplexity(o);
                return [
                    (index + 1).toString(),
                    o.title,
                    o.brand,
                    o.category,
                    o.status,
                    o.priority || 'P2',
                    `${c.level} (${c.score.toFixed(1)})`,
                    formatDate(o.created_at),
                    o.deadline ? formatDate(o.deadline) : '-'
                ];
            });

            autoTable(pdf, {
                head: [tableCols],
                body: tableRows,
                startY: tableStartY,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [24, 24, 27] }, // zinc-900
            });

            pdf.save(`Head_IT_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Gagal export data PDF');
        } finally {
            setIsExporting(false);
        }
    }

    function handleSort(field: string) {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
            case 'Triaging': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Execution': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700';
        }
    };

    const COMPLEXITY_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
    const CATEGORY_COLORS: Record<string, string> = { Design: '#8b5cf6', Programming: '#3b82f6', Asset: '#10b981' };
    const STATUS_COLORS: Record<string, string> = {
        Open: '#71717a', Triaging: '#f59e0b', Execution: '#3b82f6', Completed: '#22c55e', Rejected: '#ef4444'
    };

    // ===================== RENDER =====================
    if (loading) {
        return (
            <div className="p-10 flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">Menganalisis seluruh data tiket...</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const complexityChartData = Object.entries(stats.complexityDist).map(([name, value]) => ({ name, value }));
    const categoryChartData = Object.entries(stats.categoryDist).map(([name, value]) => ({ name, value }));
    const statusChartData = Object.entries(stats.statusDist).map(([name, value]) => ({ name, value }));
    const trendChartData = Object.entries(stats.monthlyTrend).map(([month, count]) => ({ month, count }));

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <header className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 size={24} /> PIC IT Report
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Laporan komprehensif tiket aktif & arsip — dengan deteksi kompleksitas otomatis.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Date Range Filter */}
                        <div className="flex items-center bg-white dark:bg-zinc-900 rounded-xl border border-border overflow-hidden text-xs font-bold">
                            {(['all', '7d', '30d', '90d', '6m', '1y'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-2 transition-colors ${dateRange === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                >
                                    {range === 'all' ? 'Semua' : range === '7d' ? '7 Hari' : range === '30d' ? '30 Hari' : range === '90d' ? '90 Hari' : range === '6m' ? '6 Bulan' : '1 Tahun'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button disabled={isExporting} onClick={exportXLSX} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 min-w-[120px] justify-center">
                                {isExporting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />} 
                                Export XLSX
                            </button>
                            <button disabled={isExporting} onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 min-w-[120px] justify-center">
                                {isExporting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />} 
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============ TOP METRIC CARDS ============ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Tiket Masuk', value: stats.total, icon: FileText, color: 'text-zinc-600', bg: 'bg-zinc-50 dark:bg-zinc-800' },
                    { label: 'Avg. Jarak Deadline', value: `${stats.avgDeadlineDays} hari`, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                ].map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-border"
                    >
                        <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-2`}>
                            <card.icon size={18} className={card.color} />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
                        <p className="text-xl font-bold">{card.value}</p>
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-border flex flex-col justify-center"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="inline-flex p-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10">
                            <AlertTriangle size={14} className="text-orange-600" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top 3 Alasan P1</p>
                    </div>
                    <div className="space-y-1.5 mt-1">
                        {stats.topP1Reasons.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Tidak ada data urgent</p>
                        ) : stats.topP1Reasons.map((r, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="truncate pr-2 font-medium" title={r.reason}>{r.reason}</span>
                                <span className="font-bold shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full text-[10px]">{r.count}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ============ SECONDARY STATS ============ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Tiket Aktif', value: stats.activeCount, icon: Clock, color: 'text-blue-600' },
                    { label: 'Selesai', value: stats.completedCount, icon: CheckCircle2, color: 'text-green-600' },
                    { label: 'Ditolak', value: stats.rejectedCount, icon: AlertTriangle, color: 'text-red-600' },
                    { label: 'Urgent (P1)', value: stats.p1Count, icon: Zap, color: 'text-orange-600' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-border flex items-center gap-3"
                    >
                        <stat.icon size={20} className={stat.color} />
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-bold">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ============ CHARTS ROW ============ */}
            <div ref={chartsRef} className="bg-transparent p-2 -m-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Complexity Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border"
                >
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                        <Brain size={16} className="text-violet-500" /> Distribusi Kompleksitas
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={complexityChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {complexityChartData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={COMPLEXITY_COLORS[entry.name as keyof typeof COMPLEXITY_COLORS]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 }}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border"
                >
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                        <Layers size={16} className="text-blue-500" /> Distribusi Kategori
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {categoryChartData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Status Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border"
                >
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                        <Gauge size={16} className="text-amber-500" /> Distribusi Status
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {statusChartData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* ============ TREND CHART ============ */}
            {trendChartData.length > 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border mb-6"
                >
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-primary" /> Tren Tiket Masuk per Bulan
                    </h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                <Bar dataKey="count" name="Tiket" fill="#18181b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}
            </div>

            {/* ============ DATA TABLE ============ */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <FileText size={16} /> Detail Seluruh Tiket
                            <span className="text-xs text-muted-foreground font-medium">({tableData.length} item)</span>
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Cari judul/brand..."
                                    className="pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20 w-48"
                                />
                            </div>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 text-xs rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none font-medium"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="Design">Design</option>
                                <option value="Programming">Programming</option>
                                <option value="Asset">Asset</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-xs rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none font-medium"
                            >
                                <option value="all">Semua Status</option>
                                <option value="Open">Open</option>
                                <option value="Triaging">Triaging</option>
                                <option value="Execution">Execution</option>
                                <option value="Completed">Completed</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <select
                                value={complexityFilter}
                                onChange={e => setComplexityFilter(e.target.value)}
                                className="px-3 py-2 text-xs rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none font-medium"
                            >
                                <option value="all">Semua Kompleksitas</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                                <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('title')}>
                                    <div className="flex items-center gap-1">Judul & Brand <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('category')}>
                                    <div className="flex items-center gap-1">Kategori <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('priority')}>
                                    <div className="flex items-center gap-1">Prioritas <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-1">Dibuat <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-3 py-3">Deadline</th>
                                <th className="px-3 py-3">Jarak (Hari)</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('complexity')}>
                                    <div className="flex items-center gap-1">Kompleksitas <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-3 py-3">Revisi</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tableData.length === 0 ? (
                                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">Tidak ada data ditemukan.</td></tr>
                            ) : tableData.map((o, i) => {
                                const complexity = detectComplexity(o);
                                const deadlineDays = o.deadline ? daysBetween(o.created_at, o.deadline) : null;
                                const isExpanded = expandedRow === o.id;

                                return (
                                    <motion.tr
                                        key={o.id}
                                        initial={false}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                        onClick={() => setExpandedRow(isExpanded ? null : o.id)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-foreground max-w-[200px] truncate">{o.title}</div>
                                            <div className="text-[10px] text-muted-foreground">{o.brand}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px]">{o.category}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${getStatusColor(o.status)}`}>{o.status}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${o.priority === 'P1' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                {o.priority || 'P2'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-medium whitespace-nowrap">{formatDate(o.created_at)}</td>
                                        <td className="px-3 py-3 text-[11px] font-medium whitespace-nowrap">{o.deadline ? formatDate(o.deadline) : '-'}</td>
                                        <td className="px-3 py-3">
                                            {deadlineDays !== null ? (
                                                <span className={`font-bold text-[11px] ${deadlineDays <= 3 ? 'text-red-600' : deadlineDays <= 7 ? 'text-amber-600' : 'text-foreground'}`}>
                                                    {deadlineDays} hari
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${complexity.bgColor} ${complexity.color}`}>
                                                    <Brain size={10} /> {complexity.level}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">({complexity.score.toFixed(1)})</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-[11px] font-medium text-center">{o.revision_count || 0}</td>
                                        <td className="px-3 py-3">
                                            {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Expanded Detail (shown below the table as a panel) */}
                <AnimatePresence>
                    {expandedRow && (() => {
                        const o = tableData.find(d => d.id === expandedRow);
                        if (!o) return null;
                        const complexity = detectComplexity(o);

                        return (
                            <motion.div
                                key={expandedRow}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-border overflow-hidden"
                            >
                                <div className="p-5 bg-zinc-50/50 dark:bg-zinc-800/30">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <h4 className="font-bold text-xs mb-2 uppercase tracking-widest text-muted-foreground">Detail Tiket</h4>
                                            <p className="text-xs text-foreground leading-relaxed mb-2">{o.description || 'Tidak ada deskripsi.'}</p>
                                            {o.task_type && <p className="text-[10px] text-muted-foreground">Tipe: <strong>{o.task_type}</strong></p>}
                                            {o.platform && <p className="text-[10px] text-muted-foreground">Platform: <strong>{o.platform}</strong></p>}
                                            {o.module_affected && <p className="text-[10px] text-muted-foreground">Modul: <strong>{o.module_affected}</strong></p>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs mb-2 uppercase tracking-widest text-muted-foreground">Analisis Kompleksitas</h4>
                                            <div className={`p-3 rounded-xl border ${complexity.bgColor}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Brain size={14} className={complexity.color} />
                                                    <span className={`font-bold text-sm ${complexity.color}`}>{complexity.level}</span>
                                                    <span className="text-[10px] text-muted-foreground">(Skor: {complexity.score.toFixed(1)})</span>
                                                </div>
                                                <ul className="space-y-0.5">
                                                    {complexity.factors.map((f, i) => (
                                                        <li key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <span className="w-1 h-1 rounded-full bg-current shrink-0" /> {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs mb-2 uppercase tracking-widest text-muted-foreground">Timeline</h4>
                                            <div className="space-y-1.5 text-[10px]">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Dibuat:</span>
                                                    <span className="font-bold">{formatDate(o.created_at)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Deadline:</span>
                                                    <span className="font-bold">{o.deadline ? formatDate(o.deadline) : '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Jarak ke Deadline:</span>
                                                    <span className="font-bold">{o.deadline ? `${daysBetween(o.created_at, o.deadline)} hari` : '-'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Jumlah Revisi:</span>
                                                    <span className="font-bold">{o.revision_count || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>

            {/* ============ CONCLUSION & SOP COMPLIANCE ============ */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-6 p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border-2 border-red-200 dark:border-red-900/50 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-red-900 dark:text-red-300">Kesimpulan & Evaluasi Kepatuhan SOP</h2>
                        <p className="text-xs text-red-700/80 dark:text-red-400/80 font-medium">Berdasarkan analisa komprehensif seluruh data tiket masuk</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* SOP Violation Warning */}
                    <div className="bg-white dark:bg-black/40 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">1. Analisis Tenggat Waktu (SLA)</p>
                        <p className="text-sm text-foreground leading-relaxed">
                            <strong className="text-red-600 dark:text-red-400">Sebagian besar tiket</strong> diajukan dengan tenggat waktu singkat (≤ 2 Hari). Hal ini berpotensi memengaruhi standar alokasi waktu pengerjaan normal (SLA).
                        </p>
                    </div>

                    {/* The Irony of Urgency */}
                    <div className="bg-white dark:bg-black/40 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">2. Dampak Siklus Revisi Terhadap SLA</p>
                        <p className="text-sm text-foreground leading-relaxed">
                            Tercatat <strong className="text-red-600 dark:text-red-400">sebagian besar tiket prioritas</strong> memakan waktu penyelesaian yang jauh melebihi batas waktu awal. Hal ini umumnya disebabkan oleh siklus revisi yang memanjang setelah penyerahan draft pertama.
                        </p>
                    </div>

                    {/* Shadow IT / Ignored meetings */}
                    <div className="bg-white dark:bg-black/40 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">3. Kepatuhan Pencatatan Sistem</p>
                        <p className="text-sm text-foreground leading-relaxed">
                            Terdapat <strong className="text-red-600 dark:text-red-400">banyak tiket</strong> yang mengalami keterlambatan penyelesaian namun tercatat memiliki 0 revisi di sistem. Hal ini mengindikasikan adanya komunikasi revisi di luar sistem (seperti pesan instan), yang mengakibatkan progres pekerjaan tidak dapat dilacak secara terpusat.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ============ COMPLEXITY LEGEND ============ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-border"
            >
                <h3 className="font-bold text-xs flex items-center gap-2 mb-3">
                    <Brain size={14} /> Sistem Deteksi Kompleksitas Otomatis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[10px]">
                    {[
                        { level: 'Low', range: '0–3.9', desc: 'Task sederhana, maintenance ringan, atau permintaan asset standar.', color: 'bg-green-500' },
                        { level: 'Medium', range: '4–6.9', desc: 'Bug fix menengah, revisi design, atau fitur kecil dengan deadline moderat.', color: 'bg-amber-500' },
                        { level: 'High', range: '7–9.9', desc: 'New feature kompleks, deadline ketat, multi-modul, atau ada user flow detail.', color: 'bg-orange-500' },
                        { level: 'Critical', range: '10+', desc: 'Develop new system + P1 urgent + deadline sangat ketat + multi-revisi.', color: 'bg-red-500' },
                    ].map(item => (
                        <div key={item.level} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-border">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="font-bold uppercase tracking-wider">{item.level}</span>
                                <span className="text-muted-foreground">({item.range})</span>
                            </div>
                            <p className="text-muted-foreground">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 italic">
                    * Skor dihitung berdasarkan: kategori, tipe task, panjang deskripsi, prioritas, jumlah revisi, tekanan deadline, keberadaan reproduction steps/user flow, dan jumlah modul.
                </p>
            </motion.div>
        </div>
    );
}
