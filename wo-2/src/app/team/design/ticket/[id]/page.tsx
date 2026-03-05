"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    ExternalLink,
    Paperclip,
    User,
    Building2,
    Monitor,
    Video,
    MapPin,
    ArrowRight,
    Palette,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function DesignTicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!id) return;

        async function fetchTicketData() {
            try {
                const { data: woData, error: woError } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (woError) throw woError;
                setTicket(woData);

                const { data: attachData } = await supabase
                    .from('work_order_attachments')
                    .select('*')
                    .eq('wo_id', id);

                setAttachments(attachData || []);
            } catch (err) {
                console.error("Error loading ticket:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchTicketData();
    }, [id]);

    async function handleStatusUpdate(newStatus: string) {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('work_orders')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setTicket({ ...ticket, status: newStatus });
            alert(`Status berhasil diubah ke "${newStatus}"`);
        } catch (err: any) {
            alert("Gagal update status: " + err.message);
        }
        setUpdating(false);
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
            case 'Verified': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'Execution': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'Review': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-600';
        }
    };

    const getNextStatus = (status: string) => {
        switch (status) {
            case 'Verified': return 'Execution';
            case 'Execution': return 'Review';
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6 md:p-10 max-w-4xl mx-auto text-center py-20">
                <AlertCircle size={48} className="mx-auto mb-4 text-zinc-300" />
                <h2 className="text-xl font-bold mb-2">Tiket Tidak Ditemukan</h2>
                <Link href="/team/design/queue" className="text-sm text-primary hover:underline">
                    Kembali ke Antrian
                </Link>
            </div>
        );
    }

    const nextStatus = getNextStatus(ticket.status);

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <Link
                href="/team/design/queue"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft size={16} /> Kembali ke Antrian
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="text-xs font-mono text-muted-foreground">#{ticket.ticket_number}</span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ticket.priority === 'P1' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold mb-1">{ticket.title}</h1>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Building2 size={12} /> {ticket.brand}</span>
                                <span className="flex items-center gap-1"><Palette size={12} /> {ticket.category}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {nextStatus && (
                                <button
                                    onClick={() => handleStatusUpdate(nextStatus)}
                                    disabled={updating}
                                    className="text-sm font-bold px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {updating ? (
                                        <div className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight size={14} />
                                    )}
                                    Ubah ke {nextStatus}
                                </button>
                            )}
                            {ticket.status === 'Review' && (
                                <span className="text-xs text-center font-medium text-purple-500">Menunggu Approval Head IT</span>
                            )}
                            {ticket.meeting_type === 'Online' && !['Completed', 'Rejected'].includes(ticket.status) && (
                                <Link
                                    href={`/dashboard/ticket/${ticket.id}/meet`}
                                    className="text-sm font-bold px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                    <Video size={14} /> Join Meeting
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Deskripsi</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description || "Tidak ada deskripsi."}</p>
                        </div>

                        {ticket.link && (
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Link Referensi</p>
                                <a href={ticket.link} target="_blank" rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1">
                                    <ExternalLink size={12} /> {ticket.link}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5"><User size={14} /> Pemohon</span>
                                <span className="font-bold">{ticket.requester_name || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar size={14} /> Deadline</span>
                                <span className="font-bold">
                                    {ticket.deadline ? new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Monitor size={14} /> Meeting</span>
                                <span className="font-bold">{ticket.meeting_type || '-'}</span>
                            </div>
                            {ticket.meeting_type === 'Offline' && ticket.meeting_location && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5"><MapPin size={14} /> Lokasi</span>
                                    <span className="font-bold">{ticket.meeting_location}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Clock size={14} /> Dibuat</span>
                                <span className="font-bold">
                                    {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                    <div className="px-6 md:px-8 pb-6 md:pb-8">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                            <Paperclip size={10} className="inline mr-1" /> Lampiran ({attachments.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {attachments.map((att: any) => (
                                <a
                                    key={att.id}
                                    href={att.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    {att.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img src={att.file_url} alt={att.file_name} className="w-full h-24 object-cover rounded-lg mb-2" />
                                    ) : (
                                        <div className="w-full h-24 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-2">
                                            <FileText size={24} className="text-muted-foreground" />
                                        </div>
                                    )}
                                    <p className="text-xs font-bold truncate">{att.file_name || 'File'}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
