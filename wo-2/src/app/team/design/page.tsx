"use client";

import { useEffect, useState } from "react";
import {
    Ticket,
    Clock,
    CheckCircle2,
    TrendingUp,
    Send,
    ArrowRight,
    Video,
    Calendar,
    ListOrdered,
    Palette,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

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
        <p className="text-2xl font-black tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
    </motion.div>
);

export default function DesignTeamDashboard() {
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, queue: 0 });
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch ALL design category tickets for real stats
                const { data: allDesign } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('category', 'Design')
                    .order('created_at', { ascending: false });

                // Fetch design queue (verified, ready to work)
                const { data: queue } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('category', 'Design')
                    .eq('status', 'Verified')
                    .order('created_at', { ascending: false });

                const tickets = allDesign || [];
                const queueTickets = queue || [];

                setStats({
                    total: tickets.length,
                    active: tickets.filter((t: any) => ['Execution', 'Verified', 'Review'].includes(t.status)).length,
                    completed: tickets.filter((t: any) => t.status === 'Completed').length,
                    queue: queueTickets.length,
                });

                // Active tickets (not completed/rejected)
                setMyTickets(
                    tickets.filter((t: any) => ['Execution', 'Verified', 'Review', 'Open'].includes(t.status)).slice(0, 5)
                );

                // Today's meetings
                const today = new Date().toISOString().split('T')[0];
                setMeetings(
                    tickets.filter((t: any) =>
                        t.meeting_type === 'Online' &&
                        !['Completed', 'Rejected'].includes(t.status)
                    )
                );

                setLoading(false);
            } catch (err) {
                console.error("Dashboard error:", err);
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Verified': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Execution': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Review': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Open': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
            default: return 'bg-zinc-100 text-zinc-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-pink-50 dark:bg-pink-500/10 rounded-xl">
                        <Palette size={20} className="text-pink-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Design Team Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Overview pekerjaan dan antrian tiket design.</p>
                    </div>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Tiket" value={stats.total} icon={Ticket} color="text-zinc-600" index={0} />
                <StatCard label="Sedang Aktif" value={stats.active} icon={Clock} color="text-amber-500" index={1} />
                <StatCard label="Selesai" value={stats.completed} icon={CheckCircle2} color="text-green-500" index={2} />
                <StatCard label="Antrian Baru" value={stats.queue} icon={ListOrdered} color="text-blue-500" index={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Tickets */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <h2 className="font-bold flex items-center gap-2"><Ticket size={16} /> Tiket Saya</h2>
                            <Link href="/team/design/queue" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                Lihat Semua <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="divide-y divide-border">
                            {myTickets.length > 0 ? myTickets.map((ticket, i) => (
                                <Link
                                    key={ticket.id}
                                    href={`/team/design/ticket/${ticket.id}`}
                                    className="block"
                                >
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-muted-foreground">#{ticket.ticket_number}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold truncate">{ticket.title}</p>
                                                <p className="text-xs text-muted-foreground">{ticket.brand}</p>
                                            </div>
                                            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                                        </div>
                                    </motion.div>
                                </Link>
                            )) : (
                                <div className="p-8 text-center">
                                    <Ticket size={32} className="mx-auto mb-2 text-zinc-300" />
                                    <p className="text-sm font-bold">Belum ada tiket</p>
                                    <p className="text-xs text-muted-foreground mt-1">Cek antrian tiket baru.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Meeting Today */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border">
                            <h2 className="font-bold flex items-center gap-2"><Video size={16} /> Meeting Hari Ini</h2>
                        </div>
                        <div className="p-4">
                            {meetings.length > 0 ? meetings.map((m) => (
                                <div key={m.id} className="flex items-center justify-between gap-3 mb-3 last:mb-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">{m.title}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(m.meeting_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/dashboard/ticket/${m.id}/meet`}
                                        className="text-xs font-bold px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shrink-0"
                                    >
                                        Join
                                    </Link>
                                </div>
                            )) : (
                                <div className="text-center py-4">
                                    <Video size={24} className="mx-auto mb-2 text-zinc-300" />
                                    <p className="text-xs text-muted-foreground">Tidak ada meeting hari ini.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-5 space-y-3">
                        <h2 className="font-bold flex items-center gap-2"><TrendingUp size={16} /> Aksi Cepat</h2>
                        <Link
                            href="/team/design/report"
                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <div className="p-2 bg-pink-50 dark:bg-pink-500/10 rounded-lg">
                                <Send size={14} className="text-pink-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Submit Laporan Harian</p>
                                <p className="text-[10px] text-muted-foreground">Kirim progress kerja hari ini</p>
                            </div>
                        </Link>
                        <Link
                            href="/team/design/queue"
                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                <ListOrdered size={14} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Lihat Antrian Tiket</p>
                                <p className="text-[10px] text-muted-foreground">Tiket design yang siap dikerjakan</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
