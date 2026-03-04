"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
    Ticket,
    Clock,
    CheckCircle2,
    TrendingUp,
    Send,
    ArrowRight,
    Monitor,
    Timer,
    FileText,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/lib/supabase";
import { ADMIN_ROLES, ROLES } from "@/lib/constants";

// --- Types ---
interface TicketData {
    id: string;
    status: string;
    priority: string;
    category: string;
    title: string;
    brand: string;
    deadline: string;
    created_at: string;
    updated_at: string;
}

interface ReportData {
    id: string;
    content: string;
    report_date: string;
    progress_pct: number;
}

// --- Components ---
const StatCard = ({ label, value, icon: Icon, color, index }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-sm"
    >
        <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 ${color} w-fit mb-3`}>
            <Icon size={18} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
    </motion.div>
);

const QuickActionLink = ({ href, icon: Icon, title, description, isPrimary = false }: any) => (
    <Link
        href={href}
        className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-white dark:bg-zinc-900 hover:shadow-md transition-all group"
    >
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 group-hover:text-primary transition-colors">
            <Icon size={22} />
        </div>
        <div>
            <h3 className="font-bold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight size={16} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </Link>
);

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [reports, setReports] = useState<ReportData[]>([]);
    const [role, setRole] = useState<string>("");
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin");

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const userRole = profile?.role || ROLES.DESIGNER;
                setRole(userRole);

                // Unified Ticket Query
                let ticketQuery = supabase.from('work_orders').select('*');
                if (userRole !== ROLES.HEAD_IT) {
                    ticketQuery = ticketQuery.or(`assigned_to.eq.${user.id},assigned_role.eq.${userRole}`);
                }
                
                const { data: ticketData } = await ticketQuery.order('created_at', { ascending: false });
                if (ticketData) setTickets(ticketData);

                // Fetch reports if not Head IT (personal)
                if (userRole !== ROLES.HEAD_IT) {
                    const { data: reportData } = await supabase
                        .from('daily_reports')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    if (reportData) setReports(reportData);
                }
            } catch (err) {
                console.error("Dashboard Load Error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadDashboardData();
    }, []);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'Open': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
            'Verified': 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
            'Execution': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
            'On Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
            'Review': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
            'Completed': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
            'Rejected': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        };
        return colors[status] || 'bg-zinc-100 text-zinc-700';
    };

    const isHeadIT = role === ROLES.HEAD_IT;
    const stats = [
        { label: "Total Tiket", value: tickets.length, icon: Ticket, color: "text-zinc-500" },
        { label: "Dikerjakan", value: tickets.filter(t => ['Execution', 'On Progress'].includes(t.status)).length, icon: Monitor, color: "text-blue-500" },
        { label: "Selesai", value: tickets.filter(t => t.status === 'Completed').length, icon: CheckCircle2, color: "text-green-500" },
        { 
            label: isHeadIT ? "Perlu Approval" : "Dalam Review", 
            value: isHeadIT ? tickets.filter(t => t.status === 'Open').length : tickets.filter(t => t.status === 'Review').length, 
            icon: Clock, 
            color: "text-amber-500" 
        },
    ];

    const chartData = [
        { name: 'Design', Total: tickets.filter(t => t.category === 'Design' && t.status === 'Completed').length },
        { name: 'IT Dev', Total: tickets.filter(t => t.category === 'Programming' && t.status === 'Completed').length },
        { name: 'IT Support', Total: tickets.filter(t => t.category === 'Asset' && t.status === 'Completed').length },
    ];

    if (loading) return <div className="p-10 text-center animate-pulse">Loading dashboard...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isHeadIT ? `Selamat datang, ${userName}` : `Halo, ${userName}!`}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {isHeadIT ? "Overview seluruh project tim IT." : "Ini adalah project yang ditugaskan kepada Anda."}
                </p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <StatCard key={stat.label} {...stat} index={idx} />
                ))}
            </div>

            {isHeadIT && (
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 size={20} className="text-zinc-500" />
                        <h2 className="text-lg font-bold">Project Selesai Per Divisi</h2>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 shadow-sm h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="Total" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-lg font-bold mb-5">Aksi Cepat</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <QuickActionLink href="/admin/tickets" icon={Ticket} title="Kelola Tiket" description="Lihat dan update tiket" />
                    {!isHeadIT && <QuickActionLink href="/admin/reports/submit" icon={Send} title="Laporan Harian" description="Submit laporan hari ini" />}
                    {isHeadIT && <QuickActionLink href="/admin/reports" icon={FileText} title="Laporan Tim" description="Lihat laporan harian tim" />}
                    <QuickActionLink href="/dashboard" icon={TrendingUp} title="Dashboard User" description="Kembali ke dashboard pemohon" />
                </div>
            </section>

            {!isHeadIT && reports.length > 0 && (
                <section className="space-y-5">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <FileText size={20} className="text-zinc-500" /> Laporan Terakhir Anda
                    </h2>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden divide-y divide-border">
                        {reports.map((report) => (
                            <div key={report.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold">{report.content?.substring(0, 60)}...</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(report.report_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${report.progress_pct}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground">{report.progress_pct}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
