export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import {
    Code2,
    Bug,
    Rocket,
    Settings,
    Clock,
    CheckCircle2,
    AlertCircle,
    Monitor,
    Database,
    Zap,
    Cpu,
    ArrowUpRight,
    Github,
    Server,
    TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export const dynamic = "force-dynamic";

export default function ITDevelopmentPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        bugs: 0,
    });

    useEffect(() => {
        async function loadITData() {
            try {
                setLoading(true);
                const { data } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('category', 'Programming')
                    .order('created_at', { ascending: false });

                if (data) {
                    setTickets(data);
                    setStats({
                        total: data.length,
                        active: data.filter(t => ['Open', 'Verified', 'Execution', 'Review'].includes(t.status)).length,
                        completed: data.filter(t => t.status === 'Completed').length,
                        bugs: data.filter(t => t.taskType === 'Bug Fix').length,
                    });
                }
            } catch (error) {
                console.error("Error loading IT data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadITData();
    }, []);

    const chartData = [
        { name: 'Mon', tasks: 3 },
        { name: 'Tue', tasks: 5 },
        { name: 'Wed', tasks: 2 },
        { name: 'Thu', tasks: 8 },
        { name: 'Fri', tasks: 4 },
        { name: 'Sat', tasks: 1 },
        { name: 'Sun', tasks: 0 },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Execution': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'Review': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'Completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'Open': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
            default: return 'text-zinc-400 bg-zinc-400/5 border-zinc-400/10';
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Code2 size={24} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">IT Development Node</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">ENGINEERING HUB</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Monitoring performa dan antrian sistem IT Development.</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-border flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">Main Engine Online</span>
                    </div>
                </div>
            </header>

            {/* IT Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "IT Tasks", value: stats.total, icon: Cpu, color: "text-blue-500" },
                    { label: "Ongoing", value: stats.active, icon: Zap, color: "text-amber-500" },
                    { label: "Bugs Found", value: stats.bugs, icon: Bug, color: "text-red-500" },
                    { label: "Deployed", value: stats.completed, icon: Rocket, color: "text-green-500" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border shadow-xl relative overflow-hidden group"
                    >
                        <div className={`absolute -bottom-4 -right-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 ${stat.color}`}>
                            <stat.icon size={120} />
                        </div>
                        <stat.icon size={24} className={`${stat.color} mb-4`} />
                        <div className="text-4xl font-black tracking-tighter mb-1">{stat.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deployment Activity Chart */}
                <div className="lg:col-span-2 p-8 rounded-[3rem] bg-white dark:bg-zinc-900 border border-border shadow-2xl">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-bold flex items-center gap-3 uppercase tracking-tight">
                            <TrendingUp size={20} className="text-primary" /> Velocity Chart
                        </h3>
                        <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase">Last 7 Days</span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIT" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="tasks" stroke="var(--primary)" strokeWidth={3} fill="url(#colorIT)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Environment Status */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><Server size={80} /></div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Monitor size={18} className="text-[#49FFB8]" /> INFRA STATUS
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: "Production API", status: "Healthy", color: "bg-[#49FFB8]" },
                                { label: "Supabase DB", status: "Online", color: "bg-[#49FFB8]" },
                                { label: "GitHub Webhooks", status: "Active", color: "bg-[#49FFB8]" },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{s.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase">{s.status}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${s.color} animate-pulse`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border shadow-xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Github size={18} /> RECENT COMMITS
                        </h3>
                        <div className="space-y-4">
                            {[
                                "feat: implement RLS",
                                "fix: auth middleware",
                                "refactor: api config",
                            ].map((commit, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-border/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                    <span className="text-xs font-medium truncate">{commit}</span>
                                    <ArrowUpRight size={14} className="ml-auto opacity-30" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* IT Ticket List */}
            <section className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-border shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-tight">Active Dev Pipeline</h3>
                    <span className="text-xs font-bold text-muted-foreground">{tickets.length} Total Dev Tickets</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Task & System</th>
                                <th className="px-8 py-5 text-center">Type</th>
                                <th className="px-8 py-5 text-center">Platform</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 text-right">Deadline</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-foreground">{ticket.title}</div>
                                        <div className="text-[10px] font-medium text-muted-foreground uppercase mt-1">{ticket.brand}</div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${ticket.taskType === 'Bug Fix' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-primary border-primary/20 bg-primary/5'}`}>
                                            {ticket.taskType || 'Feature'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center text-xs font-bold italic opacity-60">
                                        {ticket.platform || 'N/A'}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-xs opacity-70">
                                        {new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
