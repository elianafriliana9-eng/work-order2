"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    History,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    FileText,
    ExternalLink,
    User,
    Calendar,
    MessageSquare,
    Edit3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Revision {
    id: string;
    revision_number: number;
    revision_type: 'minor' | 'major';
    description: string;
    changes_requested: string;
    is_concept_change: boolean;
    concept_change_reason?: string;
    requires_new_ticket: boolean;
    status: 'pending' | 'addressed' | 'rejected';
    admin_response?: string;
    designer_response?: string;
    attachment_urls: string[];
    created_at: string;
    updated_at: string;
    reviewed_at?: string;
}

interface RevisionHistoryProps {
    ticketId: string;
    canRespond?: boolean;
}

export default function RevisionHistory({ ticketId, canRespond = false }: RevisionHistoryProps) {
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseText, setResponseText] = useState('');
    const [submittingResponse, setSubmittingResponse] = useState(false);

    useEffect(() => {
        loadRevisions();
    }, [ticketId]);

    async function loadRevisions() {
        try {
            const { data, error } = await supabase
                .from('work_order_revisions')
                .select('*')
                .eq('wo_id', ticketId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRevisions(data || []);
        } catch (error) {
            console.error("Error loading revisions:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitResponse(revisionId: string, status: 'addressed' | 'rejected') {
        if (!responseText.trim()) {
            alert("Mohon isi tanggapan terlebih dahulu.");
            return;
        }

        setSubmittingResponse(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const updateData: any = {
                status,
                reviewed_at: new Date().toISOString(),
            };

            if (profile?.role === 'designer' || profile?.role === 'it_dev') {
                updateData.designer_response = responseText.trim();
            } else {
                updateData.admin_response = responseText.trim();
            }

            const { error } = await supabase
                .from('work_order_revisions')
                .update(updateData)
                .eq('id', revisionId);

            if (error) throw error;

            alert("Tanggapan berhasil dikirim.");
            setResponseText('');
            setRespondingTo(null);
            loadRevisions();
        } catch (error: any) {
            alert("Gagal mengirim tanggapan: " + error.message);
        } finally {
            setSubmittingResponse(false);
        }
    }

    const getRevisionTypeColor = (type: string) => {
        switch (type) {
            case 'minor':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'major':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
            default:
                return 'bg-zinc-100 text-zinc-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
            case 'addressed':
                return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default:
                return 'bg-zinc-100 text-zinc-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return Clock;
            case 'addressed':
                return CheckCircle2;
            case 'rejected':
                return XCircle;
            default:
                return AlertCircle;
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Memuat riwayat revisi...</p>
            </div>
        );
    }

    if (revisions.length === 0) {
        return (
            <div className="p-6 text-center">
                <History size={32} className="mx-auto mb-3 text-zinc-300" />
                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Belum ada revisi</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Belum ada permintaan revisi untuk tiket ini.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                    <History size={18} className="text-primary" />
                    Riwayat Revisi
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {revisions.length} Revisi
                </span>
            </div>

            <div className="space-y-3">
                {revisions.map((revision, index) => {
                    const isExpanded = expandedRevision === revision.id;
                    const isResponding = respondingTo === revision.id;
                    const StatusIcon = getStatusIcon(revision.status);

                    return (
                        <motion.div
                            key={revision.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900"
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                onClick={() => setExpandedRevision(isExpanded ? null : revision.id)}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`p-2 rounded-xl ${getRevisionTypeColor(revision.revision_type)}`}>
                                            {revision.revision_type === 'minor' ? (
                                                <Edit3 size={16} />
                                            ) : (
                                                <AlertCircle size={16} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                                    Revisi #{revision.revision_number}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRevisionTypeColor(revision.revision_type)}`}>
                                                    {revision.revision_type === 'minor' ? 'Minor' : 'Major'}
                                                </span>
                                                {revision.is_concept_change && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                                                        Perubahan Konsep
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                {revision.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(revision.status)}`}>
                                            <StatusIcon size={10} />
                                            {revision.status === 'pending' && 'Pending'}
                                            {revision.status === 'addressed' && 'Ditanggapi'}
                                            {revision.status === 'rejected' && 'Ditolak'}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronUp size={16} className="text-zinc-400" />
                                        ) : (
                                            <ChevronDown size={16} className="text-zinc-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 space-y-4 bg-zinc-50 dark:bg-zinc-800/30">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {format(new Date(revision.created_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatDistanceToNow(new Date(revision.created_at), { locale: idLocale, addSuffix: true })}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                            Deskripsi Revisi
                                        </p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                            {revision.description}
                                        </p>
                                    </div>

                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                            Perubahan yang Diminta
                                        </p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                            {revision.changes_requested}
                                        </p>
                                    </div>

                                    {revision.is_concept_change && revision.concept_change_reason && (
                                        <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                                            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                                                Alasan Perubahan Konsep
                                            </p>
                                            <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                                                {revision.concept_change_reason}
                                            </p>
                                        </div>
                                    )}

                                    {revision.attachment_urls && revision.attachment_urls.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                                Lampiran ({revision.attachment_urls.length})
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {revision.attachment_urls.map((url, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-primary transition-colors"
                                                    >
                                                        <FileText size={12} className="text-primary" />
                                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                            Lihat File {idx + 1}
                                                        </span>
                                                        <ExternalLink size={10} className="text-zinc-400" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(revision.admin_response || revision.designer_response) && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                Tanggapan Tim
                                            </p>
                                            {revision.admin_response && (
                                                <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-200 dark:border-violet-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <User size={12} className="text-violet-600 dark:text-violet-400" />
                                                        <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                                                            PIC IT
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-violet-800 dark:text-violet-300 whitespace-pre-wrap">
                                                        {revision.admin_response}
                                                    </p>
                                                </div>
                                            )}
                                            {revision.designer_response && (
                                                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Edit3 size={12} className="text-blue-600 dark:text-blue-400" />
                                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                                            Designer
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                                                        {revision.designer_response}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {canRespond && revision.status === 'pending' && (
                                        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                            {!isResponding ? (
                                                <button
                                                    onClick={() => setRespondingTo(revision.id)}
                                                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <MessageSquare size={14} />
                                                    Beri Tanggapan
                                                </button>
                                            ) : (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={responseText}
                                                        onChange={(e) => setResponseText(e.target.value)}
                                                        rows={3}
                                                        placeholder="Tulis tanggapan Anda..."
                                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSubmitResponse(revision.id, 'addressed')}
                                                            disabled={submittingResponse || !responseText.trim()}
                                                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            Tandai Selesai
                                                        </button>
                                                        <button
                                                            onClick={() => handleSubmitResponse(revision.id, 'rejected')}
                                                            disabled={submittingResponse || !responseText.trim()}
                                                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            <XCircle size={14} />
                                                            Tolak Revisi
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRespondingTo(null);
                                                                setResponseText('');
                                                            }}
                                                            className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
