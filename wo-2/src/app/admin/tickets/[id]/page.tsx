"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Hash,
    Calendar,
    User,
    Clock,
    Download,
    CheckCircle2,
    AlertCircle,
    Monitor,
    Eye,
    XCircle,
    Palette,
    Timer,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const STATUS_FLOW = ['Open', 'Verified', 'Execution', 'Review', 'Completed'];

export default function AdminTicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setRole(profile?.role || 'designer');

            const { data: woData } = await supabase
                .from('work_orders')
                .select('*')
                .eq('id', id)
                .single();
            if (woData) setTicket(woData);

            const { data: attachData } = await supabase
                .from('work_order_attachments')
                .select('*')
                .eq('wo_id', id);
            if (attachData) setAttachments(attachData);

            setLoading(false);
        }
        load();
    }, [id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
            case 'Verified': return 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400';
            case 'Execution': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Review': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700';
        }
    };

    async function updateStatus(newStatus: string) {
        setUpdating(true);
        const { error } = await supabase
            .from('work_orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setTicket((prev: any) => ({ ...prev, status: newStatus }));
        } else {
            alert("Gagal update status: " + error.message);
        }
        setUpdating(false);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-10 text-center">
                <p className="font-bold">Tiket tidak ditemukan.</p>
                <Link href="/admin/tickets" className="text-primary text-sm mt-2 inline-block hover:underline">
                    ← Kembali
                </Link>
            </div>
        );
    }

    const isHeadIT = role === 'head_it';
    const currentIndex = STATUS_FLOW.indexOf(ticket.status);

    // Determine which statuses this role can transition to
    const getAvailableStatuses = () => {
        if (isHeadIT) {
            // Head IT can approve (Verified), reject, or complete
            if (ticket.status === 'Open') return ['Verified', 'Rejected'];
            if (ticket.status === 'Review') return ['Completed', 'Execution'];
            return STATUS_FLOW.filter(s => s !== ticket.status);
        } else {
            // Team members can update progress
            if (ticket.status === 'Verified') return ['Execution'];
            if (ticket.status === 'Execution') return ['Review'];
            return [];
        }
    };

    const availableStatuses = getAvailableStatuses();

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Back */}
            <Link
                href="/admin/tickets"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft size={16} /> Kembali ke Daftar Tiket
            </Link>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-6 md:p-8 mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                                <Hash size={12} />#{ticket.ticket_number}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                            {ticket.priority === 'P1' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-500/20 uppercase">
                                    Urgent
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold">{ticket.title}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{ticket.brand} • {ticket.category}</p>
                    </div>
                </div>

                {/* Status Flow */}
                <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
                    {STATUS_FLOW.map((s, i) => {
                        const isDone = i <= currentIndex;
                        const isCurrent = s === ticket.status;
                        return (
                            <div key={s} className="flex items-center gap-1">
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCurrent
                                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                                        : isDone
                                            ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                    }`}>
                                    {s}
                                </div>
                                {i < STATUS_FLOW.length - 1 && (
                                    <div className={`w-6 h-0.5 ${isDone ? "bg-zinc-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                {availableStatuses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-border">
                        <span className="text-xs font-bold text-muted-foreground mr-2 self-center">Update Status:</span>
                        {availableStatuses.map((s) => (
                            <button
                                key={s}
                                onClick={() => updateStatus(s)}
                                disabled={updating}
                                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors disabled:opacity-50 ${s === 'Rejected'
                                        ? "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                        : s === 'Completed'
                                            ? "border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10"
                                            : "border-border hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {s === 'Rejected' && <XCircle size={12} className="inline mr-1" />}
                                {s === 'Completed' && <CheckCircle2 size={12} className="inline mr-1" />}
                                {s === 'Execution' && <Monitor size={12} className="inline mr-1" />}
                                {s === 'Verified' && <CheckCircle2 size={12} className="inline mr-1" />}
                                {s === 'Review' && <Eye size={12} className="inline mr-1" />}
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Deadline</p>
                        <p className="text-sm font-bold flex items-center gap-1.5">
                            <Calendar size={14} className="text-muted-foreground" />
                            {new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Prioritas</p>
                        <p className="text-sm font-bold">{ticket.priority || 'P2'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Platform</p>
                        <p className="text-sm font-bold">{ticket.platform || '-'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Dimensi</p>
                        <p className="text-sm font-bold">{ticket.dimension || '-'}</p>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <h3 className="font-bold text-sm mb-2">Deskripsi Brief</h3>
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {ticket.description}
                    </div>
                </div>

                {/* Urgent Reason */}
                {ticket.urgent_reason && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                        <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
                            <AlertCircle size={12} /> Alasan Urgent
                        </p>
                        <p className="text-sm">{ticket.urgent_reason}</p>
                    </div>
                )}

                {/* Admin Notes */}
                {ticket.admin_notes && (
                    <div className="mb-6 p-4 rounded-xl bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10">
                        <p className="text-xs font-bold text-violet-600 mb-1">Catatan Admin</p>
                        <p className="text-sm">{ticket.admin_notes}</p>
                    </div>
                )}
            </motion.div>

            {/* Attachments */}
            {attachments.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-6 md:p-8"
                >
                    <h3 className="font-bold mb-4">Lampiran ({attachments.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {attachments.map((att) => (
                            <a
                                key={att.id}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-xl border border-border overflow-hidden hover:shadow-md transition-all group"
                            >
                                {att.file_type?.startsWith('image/') ? (
                                    <img
                                        src={att.file_url}
                                        alt="attachment"
                                        className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-28 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <Download size={20} className="text-muted-foreground" />
                                    </div>
                                )}
                                <div className="p-2 text-center">
                                    <p className="text-[10px] text-muted-foreground truncate">{att.file_type}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
