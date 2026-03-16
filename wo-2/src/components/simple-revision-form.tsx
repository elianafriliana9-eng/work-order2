"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    AlertCircle,
    Clock,
    FileText,
    Upload,
    X,
    Info,
    AlertTriangle,
    CheckCircle2,
    Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isBefore } from "date-fns";

interface SimpleRevisionFormProps {
    ticketId: string;
    ticketStatus: string;
    reviewStartedAt?: string | null;
    revisionWindowExpiresAt?: string | null;
    revisionCount?: number;
    onRevisionSubmitted?: () => void;
}

const MAX_REVISIONS = 2;

export default function SimpleRevisionForm({
    ticketId,
    ticketStatus,
    reviewStartedAt,
    revisionWindowExpiresAt,
    revisionCount = 0,
    onRevisionSubmitted,
}: SimpleRevisionFormProps) {
    const [now, setNow] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [description, setDescription] = useState('');
    const [changesRequested, setChangesRequested] = useState('');

    // Update timer every minute
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Check if revision window is still open
    const isRevisionWindowOpen = () => {
        if (ticketStatus !== 'Review' && ticketStatus !== 'Completed') return false;
        // If no expiration data yet, assume window is open (for existing tickets)
        if (!revisionWindowExpiresAt) return ticketStatus === 'Review';
        return isBefore(now, new Date(revisionWindowExpiresAt));
    };

    // Calculate time remaining
    const getTimeRemaining = () => {
        if (!revisionWindowExpiresAt) {
            // If no expiration set, show -- : --
            return { hours: 0, minutes: 0, expired: false, noData: true };
        }
        const expires = new Date(revisionWindowExpiresAt);
        const remaining = expires.getTime() - now.getTime();

        if (remaining <= 0) return { hours: 0, minutes: 0, expired: true };

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes, expired: false };
    };

    const timeRemaining = getTimeRemaining();
    const canSubmitRevision = ticketStatus === 'Review' && isRevisionWindowOpen() && revisionCount < MAX_REVISIONS;
    const hasReachedLimit = revisionCount >= MAX_REVISIONS;
    const isWindowExpired = timeRemaining?.expired || !isRevisionWindowOpen();

    // Debug log
    useEffect(() => {
        console.log('Revision Form Debug:', {
            ticketStatus,
            revisionCount,
            canSubmitRevision,
            hasReachedLimit,
            isWindowExpired,
            reviewStartedAt,
            revisionWindowExpiresAt,
        });
    }, [ticketStatus, revisionCount, canSubmitRevision, hasReachedLimit, isWindowExpired]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            const filteredFiles = newFiles.filter(file => {
                if (!allowedTypes.includes(file.type)) {
                    alert(`File ${file.name} ditolak. Hanya file gambar atau PDF yang diizinkan.`);
                    return false;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} terlalu besar. Maksimal 5MB.`);
                    return false;
                }
                return true;
            });
            setFiles((prev) => [...prev, ...filteredFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim() || !changesRequested.trim()) {
            alert("Mohon lengkapi deskripsi revisi dan perubahan yang diminta.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Get current revision count to determine revision number
            const { data: existingRevisions } = await supabase
                .from('work_order_revisions')
                .select('revision_number')
                .eq('wo_id', ticketId)
                .order('revision_number', { ascending: false })
                .limit(1);

            const lastRevisionNumber = existingRevisions && existingRevisions.length > 0 
                ? existingRevisions[0].revision_number 
                : 0;

            // Upload files first
            const attachmentUrls: string[] = [];
            if (files.length > 0) {
                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `revisions/${ticketId}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(filePath);

                    attachmentUrls.push(publicUrl);
                }
            }

            // Submit revision
            const { error: revisionError } = await supabase
                .from('work_order_revisions')
                .insert([{
                    wo_id: ticketId,
                    requester_id: user.id,
                    revision_number: lastRevisionNumber + 1,
                    revision_type: 'minor',
                    description: description.trim(),
                    changes_requested: changesRequested.trim(),
                    is_concept_change: false,
                    requires_new_ticket: false,
                    attachment_urls: attachmentUrls,
                    status: 'pending',
                }]);

            if (revisionError) throw revisionError;

            alert("Revisi berhasil diajukan! Tim design akan meninjau permintaan Anda.");
            
            // Reset form
            setDescription('');
            setChangesRequested('');
            setFiles([]);
            
            if (onRevisionSubmitted) {
                onRevisionSubmitted();
            }
        } catch (error: any) {
            console.error("Error submitting revision:", error);
            alert("Gagal mengajukan revisi: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show form for Review and Completed status (for viewing after 24h)
    if (ticketStatus !== 'Review' && ticketStatus !== 'Completed') {
        return null;
    }

    return (
        <div className="mt-8">
            <div className={`rounded-2xl border-2 p-6 ${
                hasReachedLimit || isWindowExpired
                    ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-200 dark:border-amber-500/20'
            }`}>
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                            hasReachedLimit || isWindowExpired
                                ? 'bg-zinc-100 dark:bg-zinc-700'
                                : 'bg-amber-100 dark:bg-amber-500/20'
                        }`}>
                            <AlertCircle size={24} className={
                                hasReachedLimit || isWindowExpired
                                    ? 'text-zinc-400'
                                    : 'text-amber-600 dark:text-amber-400'
                            } />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${
                                hasReachedLimit || isWindowExpired
                                    ? 'text-zinc-600 dark:text-zinc-400'
                                    : 'text-amber-900 dark:text-amber-200'
                            }`}>
                                Ajukan Revisi
                            </h3>
                            <p className={`text-sm ${
                                hasReachedLimit || isWindowExpired
                                    ? 'text-zinc-500'
                                    : 'text-amber-700 dark:text-amber-300'
                            }`}>
                                Limit: <span className="font-bold">{revisionCount}/{MAX_REVISIONS}</span> revisi digunakan
                            </p>
                        </div>
                    </div>

                    {canSubmitRevision && timeRemaining && !timeRemaining.expired && (
                        <div className="text-right">
                            <div className={`text-3xl font-black tabular-nums ${
                                timeRemaining.noData
                                    ? 'text-zinc-400'
                                    : timeRemaining.hours < 2 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : 'text-amber-600 dark:text-amber-400'
                            }`}>
                                {timeRemaining.noData ? '-- : --' : `${timeRemaining.hours}j ${timeRemaining.minutes}m`}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                {timeRemaining.noData ? 'Window Aktif' : 'Waktu Tersisa'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {hasReachedLimit && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                                    Batas Revisi Tercapai
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                    Anda telah menggunakan semua {MAX_REVISIONS} kali revisi yang tersedia. 
                                    Jika masih ada perubahan yang dibutuhkan, silakan buat tiket WO baru.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isWindowExpired && !hasReachedLimit && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Clock size={20} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                                    Batas Waktu Revisi Lewat
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                    Batas waktu pengajuan revisi adalah 24 jam setelah status Review. 
                                    Waktu telah berakhir dan tiket dianggap sudah sesuai.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {canSubmitRevision && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                        Panduan Pengajuan Revisi
                                    </p>
                                    <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1">
                                        <li>• Anda memiliki <strong>{MAX_REVISIONS - revisionCount}x revisi</strong> tersisa</li>
                                        <li>• Kumpulkan semua revisi dalam satu submission</li>
                                        <li>• Jelaskan secara spesifik perubahan yang diinginkan</li>
                                        <li>• Upload referensi visual untuk mempermudah (opsional)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Description (Required) */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">
                                Keterangan Revisi <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Jelaskan secara detail apa yang perlu direvisi pada design..."
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                                required
                            />
                        </div>

                        {/* Changes Requested (Required) */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">
                                Perubahan yang Diminta <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={changesRequested}
                                onChange={(e) => setChangesRequested(e.target.value)}
                                rows={4}
                                placeholder="Contoh:
• Ubah warna background dari biru ke merah
• Perbesar ukuran logo 20%
• Tambahkan teks 'Promo' di pojok kanan atas"
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                                required
                            />
                        </div>

                        {/* File Upload (Optional) */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">
                                Upload File Referensi <span className="text-zinc-400 font-normal">(Opsional)</span>
                            </label>
                            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center relative hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                    disabled={isSubmitting}
                                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <Upload size={28} className="mx-auto text-zinc-400 mb-2" />
                                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                                    Klik atau drag file ke sini
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    PNG, JPG, PDF - Maksimal 5MB per file
                                </p>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                                        <CheckCircle2 size={14} />
                                        {files.length} file terpilih
                                    </p>
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600">
                                                    <FileText size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate text-zinc-700 dark:text-zinc-300">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Mengirim Revisi...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Ajukan Revisi #{revisionCount + 1}
                                </>
                            )}
                        </button>

                        {/* Info Note */}
                        <p className="text-[10px] text-center text-zinc-500">
                            <Info size={10} className="inline mr-1" />
                            Revisi akan ditinjau oleh tim design dalam 1-2 hari kerja. 
                            Pastikan keterangan yang diisi sudah lengkap dan jelas.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
