"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    Upload,
    X,
    Info,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, formatDistanceToNow, isBefore, addHours } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface RevisionSubmissionProps {
    ticketId: string;
    ticketStatus: string;
    reviewStartedAt?: string | null;
    revisionWindowExpiresAt?: string | null;
    onRevisionSubmitted?: () => void;
}

interface RevisionFormData {
    revisionType: 'minor' | 'major';
    description: string;
    changesRequested: string;
    isConceptChange: boolean;
    conceptChangeReason: string;
    requiresNewTicket: boolean;
}

export default function RevisionSubmission({
    ticketId,
    ticketStatus,
    reviewStartedAt,
    revisionWindowExpiresAt,
    onRevisionSubmitted,
}: RevisionSubmissionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [showConceptChangeWarning, setShowConceptChangeWarning] = useState(false);

    const [formData, setFormData] = useState<RevisionFormData>({
        revisionType: 'minor',
        description: '',
        changesRequested: '',
        isConceptChange: false,
        conceptChangeReason: '',
        requiresNewTicket: false,
    });

    // Update timer every minute
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Check if revision window is still open
    const isRevisionWindowOpen = () => {
        if (ticketStatus !== 'Review') return false;
        if (!revisionWindowExpiresAt) return false;
        return isBefore(now, new Date(revisionWindowExpiresAt));
    };

    // Calculate time remaining
    const getTimeRemaining = () => {
        if (!revisionWindowExpiresAt) return null;
        const expires = new Date(revisionWindowExpiresAt);
        const remaining = expires.getTime() - now.getTime();

        if (remaining <= 0) return { hours: 0, minutes: 0, expired: true };

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes, expired: false };
    };

    const timeRemaining = getTimeRemaining();
    const canSubmitRevision = ticketStatus === 'Review' && isRevisionWindowOpen();

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

    const handleConceptChangeToggle = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            isConceptChange: checked,
            requiresNewTicket: checked,
        }));
        setShowConceptChangeWarning(checked);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description.trim() || !formData.changesRequested.trim()) {
            alert("Mohon lengkapi semua field yang wajib diisi.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

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
                    revision_type: formData.revisionType,
                    description: formData.description.trim(),
                    changes_requested: formData.changesRequested.trim(),
                    is_concept_change: formData.isConceptChange,
                    concept_change_reason: formData.isConceptChange ? formData.conceptChangeReason.trim() : null,
                    requires_new_ticket: formData.requiresNewTicket,
                    attachment_urls: attachmentUrls,
                    status: 'pending',
                }]);

            if (revisionError) throw revisionError;

            alert("Revisi berhasil diajukan! Tim design akan meninjau permintaan Anda.");
            
            // Reset form
            setFormData({
                revisionType: 'minor',
                description: '',
                changesRequested: '',
                isConceptChange: false,
                conceptChangeReason: '',
                requiresNewTicket: false,
            });
            setFiles([]);
            setIsOpen(false);
            
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

    if (!canSubmitRevision) {
        return null;
    }

    return (
        <div className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6"
            >
                {/* Header with timer */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
                            <Clock size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-200">
                                Ajukan Revisi
                            </h3>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                Batas waktu: 24 jam setelah status Review
                            </p>
                        </div>
                    </div>

                    {timeRemaining && !timeRemaining.expired && (
                        <div className="text-right">
                            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                                {timeRemaining.hours}j {timeRemaining.minutes}m
                            </div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                                Waktu Tersisa
                            </div>
                        </div>
                    )}
                </div>

                {/* Warning if concept change */}
                <AnimatePresence>
                    {showConceptChangeWarning && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl"
                        >
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-red-800 dark:text-red-300">
                                        Perubahan Konsep Total
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                        Revisi yang mengubah konsep awal secara total akan memerlukan pembuatan tiket WO baru dan masuk antrian dari awal. 
                                        Pastikan ini benar-benar yang Anda inginkan.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-500/20 rounded-xl font-bold text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                >
                    {isOpen ? 'Tutup Form Revisi' : 'Buat Permintaan Revisi'}
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Form */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSubmit}
                            className="mt-4 space-y-4 overflow-hidden"
                        >
                            {/* Revision Type */}
                            <div>
                                <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">
                                    Jenis Revisi <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, revisionType: 'minor' }))}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            formData.revisionType === 'minor'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                        }`}
                                    >
                                        <CheckCircle2 size={20} className="mx-auto mb-2" />
                                        <p className="text-sm font-bold">Minor</p>
                                        <p className="text-[10px] text-zinc-500 mt-1">Perubahan kecil, warna, teks</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, revisionType: 'major' }))}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            formData.revisionType === 'major'
                                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400'
                                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                        }`}
                                    >
                                        <AlertCircle size={20} className="mx-auto mb-2" />
                                        <p className="text-sm font-bold">Major</p>
                                        <p className="text-[10px] text-zinc-500 mt-1">Perubahan signifikan</p>
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">
                                    Deskripsi Revisi <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    placeholder="Jelaskan secara umum apa yang perlu direvisi..."
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                                    required
                                />
                            </div>

                            {/* Changes Requested */}
                            <div>
                                <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">
                                    Perubahan yang Diminta <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.changesRequested}
                                    onChange={(e) => setFormData(prev => ({ ...prev, changesRequested: e.target.value }))}
                                    rows={4}
                                    placeholder="Sebutkan secara spesifik perubahan yang diinginkan (poin-poin)..."
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                                    required
                                />
                                <p className="text-[10px] text-zinc-500 mt-1">
                                    💡 Tips: Kumpulkan semua revisi dalam satu submission, tidak perlu cicil satu per satu.
                                </p>
                            </div>

                            {/* Concept Change Toggle */}
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isConceptChange}
                                        onChange={(e) => handleConceptChangeToggle(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                            Ini mengubah konsep awal secara total
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Jika ya, Anda akan perlu membuat tiket WO baru untuk antrian ulang.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Concept Change Reason (if applicable) */}
                            {formData.isConceptChange && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20"
                                >
                                    <label className="block text-sm font-bold mb-2 text-red-800 dark:text-red-300">
                                        Alasan Perubahan Konsep <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.conceptChangeReason}
                                        onChange={(e) => setFormData(prev => ({ ...prev, conceptChangeReason: e.target.value }))}
                                        rows={2}
                                        placeholder="Jelaskan mengapa konsep awal perlu diubah total..."
                                        className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                                        required
                                    />
                                </motion.div>
                            )}

                            {/* File Attachments */}
                            <div>
                                <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">
                                    Lampiran (Opsional)
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
                                    <Upload size={24} className="mx-auto text-zinc-400 mb-2" />
                                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                                        Upload referensi visual
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-1">
                                        Gambar atau PDF, maksimal 5MB per file
                                    </p>
                                </div>

                                {files.length > 0 && (
                                    <div className="mt-3 space-y-2">
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
                                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Ajukan Revisi
                                    </>
                                )}
                            </button>

                            {/* Info Note */}
                            <p className="text-[10px] text-center text-zinc-500">
                                <Info size={10} className="inline mr-1" />
                                Revisi wajib diajukan dalam 24 jam setelah status Review. 
                                Setelah batas waktu, tiket otomatis dianggap Completed.
                            </p>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
