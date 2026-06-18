"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Upload,
    FileText,
    Link as LinkIcon,
    CheckCircle2,
    AlertCircle,
    Image,
    ExternalLink,
    Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SubmitForReviewModalProps {
    ticketId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SubmitForReviewModal({
    ticketId,
    isOpen,
    onClose,
    onSuccess,
}: SubmitForReviewModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [gdriveLink, setGdriveLink] = useState('');
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            
            const filteredFiles = newFiles.filter(file => {
                if (!allowedTypes.includes(file.type)) {
                    alert(`File ${file.name} ditolak. Hanya file PNG/JPG yang diizinkan.`);
                    return false;
                }
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File ${file.name} terlalu besar. Maksimal 10MB.`);
                    return false;
                }
                return true;
            });
            
            setFiles((prev) => [...prev, ...filteredFiles]);
            setError('');
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (files.length === 0 && !gdriveLink.trim()) {
            setError("Mohon upload file design (PNG/JPG) atau cantumkan link Google Drive.");
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            let finalDesignUrls: string[] = [];

            // Upload files to Supabase Storage
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `final_designs/${ticketId}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false,
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(filePath);

                    finalDesignUrls.push(publicUrl);
                    
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: 100
                    }));
                }
            }

            // Update work order with final design and change status to Review
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const updateData: any = {
                status: 'Review',
                final_design_urls: finalDesignUrls,
                design_submitted_by: user.id,
                review_started_at: now.toISOString(),
                revision_window_expires_at: expiresAt.toISOString(),
            };

            if (gdriveLink.trim()) {
                updateData.final_design_gdrive_link = gdriveLink.trim();
            }

            const { error: updateError } = await supabase
                .from('work_orders')
                .update(updateData)
                .eq('id', ticketId);

            if (updateError) throw updateError;

            onSuccess();
            // Reset form
            setFiles([]);
            setGdriveLink('');
            setUploadProgress({});
        } catch (err: any) {
            console.error("Error submitting design:", err);
            setError(err.message || "Gagal mengirim design untuk review.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-white dark:bg-zinc-900">
                    <div>
                        <h2 className="text-xl font-bold">Submit untuk Review</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            Upload hasil design final untuk approval PIC IT
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
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                    Persyaratan Submit Review
                                </p>
                                <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1">
                                    <li>• Upload file PNG/JPG (maksimal 10MB per file)</li>
                                    <li>• Atau cantumkan link Google Drive yang dapat diakses</li>
                                    <li>• PIC IT akan meninjau design dalam 1-2 hari kerja (tidak termasuk akhir pekan & hari libur nasional)</li>
                                    <li>• Setelah approved, status berubah menjadi Completed</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-bold mb-2">
                            Upload File Design (PNG/JPG)
                        </label>
                        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 text-center relative hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleFileChange}
                                disabled={submitting}
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-3">
                                <Image size={32} className="text-primary" />
                            </div>
                            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                Klik atau drag file ke sini
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                PNG, JPG, WebP - Maksimal 10MB per file
                            </p>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700"
                                    >
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Image size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate text-zinc-700 dark:text-zinc-300">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        {uploadProgress[file.name] === 100 ? (
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-zinc-900 px-4 text-zinc-500">
                                Atau
                            </span>
                        </div>
                    </div>

                    {/* Google Drive Link */}
                    <div>
                        <label className="block text-sm font-bold mb-2">
                            Link Google Drive (Opsional)
                        </label>
                        <div className="relative">
                            <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="url"
                                value={gdriveLink}
                                onChange={(e) => setGdriveLink(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                disabled={submitting}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            Pastikan link dapat diakses oleh siapa saja dengan link
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                            <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Mengupload Design...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Submit untuk Review
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
