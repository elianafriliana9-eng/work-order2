"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Image,
    ExternalLink,
    FileText,
    AlertCircle,
    X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DesignApprovalModalProps {
    ticketId: string;
    finalDesignUrls: string[];
    gdriveLink?: string | null;
    isOpen: boolean;
    onClose: () => void;
    onApproved: () => void;
}

export default function DesignApprovalModal({
    ticketId,
    finalDesignUrls,
    gdriveLink,
    isOpen,
    onClose,
    onApproved,
}: DesignApprovalModalProps) {
    const [approving, setApproving] = useState(false);
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleApproval = async (status: 'approved' | 'rejected') => {
        if (status === 'rejected' && !notes.trim()) {
            setError("Mohon isi alasan penolakan.");
            return;
        }

        setApproving(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const updateData: any = {
                head_it_approval_status: status,
                head_it_approval_by: user.id,
                head_it_approval_at: new Date().toISOString(),
            };

            if (status === 'approved') {
                updateData.status = 'Completed';
            } else {
                updateData.status = 'Execution'; // Back to execution for revisions
                updateData.head_it_approval_notes = notes.trim();
            }

            const { error: updateError } = await supabase
                .from('work_orders')
                .update(updateData)
                .eq('id', ticketId);

            if (updateError) throw updateError;

            onApproved();
            setNotes('');
            setAction(null);
        } catch (err: any) {
            console.error("Error approving design:", err);
            setError(err.message || "Gagal memproses approval.");
        } finally {
            setApproving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-white dark:bg-zinc-900">
                    <div>
                        <h2 className="text-xl font-bold">Approval Design Final</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tinjau design sebelum approved untuk pemohon
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Info Box */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
                                    Checklist Approval
                                </p>
                                <ul className="text-xs text-purple-700 dark:text-purple-400 mt-2 space-y-1">
                                    <li>• Design sesuai dengan brief awal</li>
                                    <li>• Tidak ada kesalahan visual (typo, warna, layout)</li>
                                    <li>• Format dan ukuran sesuai requirement</li>
                                    <li>• Jika approved → Status menjadi Completed</li>
                                    <li>• Jika rejected → Kembali ke Execution dengan catatan</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Design Preview */}
                    <div>
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Image size={16} className="text-primary" />
                            Preview Design ({finalDesignUrls.length} file)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {finalDesignUrls.map((url, index) => (
                                <div
                                    key={index}
                                    className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-zinc-100 dark:bg-zinc-800"
                                >
                                    <img
                                        src={url}
                                        alt={`Design ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={16} className="text-white" />
                                        <span className="text-xs font-bold text-white">Lihat Full Size</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Google Drive Link */}
                    {gdriveLink && (
                        <div>
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <FileText size={16} className="text-primary" />
                                Google Drive Link
                            </h3>
                            <a
                                href={gdriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                            >
                                <ExternalLink size={18} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 truncate">
                                    {gdriveLink}
                                </span>
                            </a>
                        </div>
                    )}

                    {/* Approval Actions */}
                    <div className="border-t border-border pt-6">
                        {action === null ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAction('approve')}
                                    disabled={approving}
                                    className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    Approve Design
                                </button>
                                <button
                                    onClick={() => setAction('reject')}
                                    disabled={approving}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <XCircle size={18} />
                                    Reject Design
                                </button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        ← Kembali
                                    </button>
                                    <h3 className="text-sm font-bold">
                                        {action === 'approve' ? 'Konfirmasi Approval' : 'Alasan Penolakan'}
                                    </h3>
                                </div>

                                {action === 'reject' && (
                                    <div>
                                        <label className="block text-sm font-bold mb-2">
                                            Alasan Penolakan <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={4}
                                            placeholder="Jelaskan apa yang perlu diperbaiki..."
                                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                                        />
                                        {error && (
                                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                <AlertCircle size={12} />
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => handleApproval(action === 'approve' ? 'approved' : 'rejected')}
                                    disabled={approving}
                                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                                        action === 'approve'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                >
                                    {approving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            {action === 'approve' ? (
                                                <>
                                                    <CheckCircle2 size={18} />
                                                    Ya, Approve Design
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={18} />
                                                    Kirim Penolakan
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
