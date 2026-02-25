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
    Maximize2
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function TicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        async function fetchTicketData() {
            try {
                // 1. Fetch Ticket
                const { data: woData, error: woError } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (woError) throw woError;
                setTicket(woData);

                // 2. Fetch Attachments
                const { data: attachData, error: attachError } = await supabase
                    .from('work_order_attachments')
                    .select('*')
                    .eq('wo_id', id);

                if (attachError) throw attachError;
                setAttachments(attachData || []);

            } catch (error: any) {
                console.error("Error fetching ticket:", error.message);
                // Optionally redirect or show error
            } finally {
                setLoading(false);
            }
        }

        fetchTicketData();
    }, [id]);

    if (loading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Memuat detail tiket...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-2xl font-bold mb-4">Tiket tidak ditemukan</h2>
                <Link href="/dashboard" className="text-primary hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Open': return { color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800', icon: Clock, label: 'Diantrekan' };
            case 'Triaging': return { color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10', icon: AlertCircle, label: 'Verifikasi Head' };
            case 'Execution': return { color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10', icon: Monitor, label: 'Sedang Dikerjakan' };
            case 'Completed': return { color: 'text-green-600 bg-green-50 dark:bg-green-500/10', icon: CheckCircle2, label: 'Selesai' };
            default: return { color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800', icon: Clock, label: status };
        }
    };

    const statusInfo = getStatusInfo(ticket.status);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header / Nav */}
            <div className="mb-8 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-semibold py-2 px-4 rounded-lg bg-white dark:bg-zinc-900 border border-border shadow-sm"
                >
                    <ArrowLeft size={18} /> Kembali
                </button>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${statusInfo.color}`}>
                        <statusInfo.icon size={14} />
                        {statusInfo.label}
                    </span>
                    {ticket.priority === 'P1' && (
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            Urgent (P1)
                        </span>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-border shadow-sm">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold tracking-tight mb-2">{ticket.title}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                    <Building2 size={14} /> {ticket.brand}
                                </div>
                                <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                    <FileText size={14} /> {ticket.category}
                                </div>
                                <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                    <Calendar size={14} /> {new Date(ticket.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-zinc dark:prose-invert max-w-none">
                            <h3 className="text-lg font-bold mb-3 border-b pb-2">Deskripsi / Brief</h3>
                            <p className="whitespace-pre-wrap leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {ticket.description}
                            </p>
                        </div>

                        {(ticket.platform || ticket.dimension) && (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ticket.platform && (
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-border">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Platform/Media</p>
                                        <p className="font-semibold">{ticket.platform}</p>
                                    </div>
                                )}
                                {ticket.dimension && (
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-border">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Dimensi/Ukuran</p>
                                        <p className="font-semibold">{ticket.dimension}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Attachments */}
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Paperclip size={20} className="text-primary" />
                                Lampiran & Referensi
                            </h3>
                            <span className="text-sm text-muted-foreground font-medium">{attachments.length} File</span>
                        </div>

                        {attachments.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {attachments.map((file, idx) => (
                                    <a
                                        key={file.id}
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-border hover:border-primary transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold truncate">File Lampiran {idx + 1}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Klik untuk lihat</p>
                                            </div>
                                        </div>
                                        <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                                <p className="text-muted-foreground text-sm font-medium italic">Tidak ada lampiran terunggah.</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Status & Timeline */}
                <div className="space-y-8">
                    {/* Status Tracking Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-border shadow-sm">
                        <h3 className="text-lg font-bold mb-6">Ticket History</h3>
                        <div className="space-y-6">
                            {[
                                { status: 'Open', label: 'Tiket Diterbitkan', time: ticket.created_at, icon: Clock, current: ticket.status === 'Open' },
                                { status: 'Triaging', label: 'Diverifikasi Head', time: null, icon: CheckCircle2, current: ticket.status === 'Triaging' },
                                { status: 'Execution', label: 'Sedang Dikerjakan', time: null, icon: Monitor, current: ticket.status === 'Execution' },
                                { status: 'Completed', label: 'Selesai & Final Asset', time: null, icon: Maximize2, current: ticket.status === 'Completed' },
                            ].map((step, i, arr) => {
                                const isPassed = arr.findIndex(s => s.status === ticket.status) >= i;
                                const isFinal = i === arr.length - 1;

                                return (
                                    <div key={step.status} className="relative flex gap-4">
                                        {!isFinal && (
                                            <div className={`absolute left-4 top-8 w-0.5 h-10 ${isPassed ? 'bg-primary' : 'bg-zinc-100 dark:bg-zinc-800'}`} />
                                        )}
                                        <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${isPassed
                                                ? 'bg-primary border-primary text-primary-foreground'
                                                : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-muted-foreground'
                                            }`}>
                                            <step.icon size={14} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isPassed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                                            {step.time && (
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(step.time).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 border border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pemohon</p>
                                <p className="font-bold">You</p>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed italic">
                            Email konfirmasi pengerjaan akan dikirim otomatis saat status berubah menjadi 'Execution'.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
