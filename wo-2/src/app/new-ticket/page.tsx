"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Layout,
    Code2,
    PenTool,
    Database,
    Calendar,
    AlertCircle,
    FileUp,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, isBefore } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// --- Schema Definitions ---

const formSchema = z.object({
    title: z.string().min(5, "Judul minimal 5 karakter"),
    brand: z.string().min(2, "Brand harus diisi"),
    category: z.enum(["Design", "Programming", "Asset"]),
    // Step 2: Conditional
    description: z.string().min(20, "Deskripsi minimal 20 karakter"),
    platform: z.string().optional(),
    dimension: z.string().optional(),
    // Step 3
    deadline: z.string(),
    urgentReason: z.string().optional(),
    // Step 4
    confirmSOP: z.boolean().refine(v => v === true, "Anda harus mengonfirmasi SOP"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTicketPage() {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "Design",
            deadline: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        }
    });

    const selectedCategory = watch("category");
    const selectedDeadline = watch("deadline");

    const isUrgent = () => {
        if (!selectedDeadline) return false;
        const threeDaysFromNow = addDays(new Date(), 3);
        return isBefore(new Date(selectedDeadline), threeDaysFromNow);
    };

    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const router = useRouter();

    const onSubmit = async (data: FormValues) => {
        if (step < totalSteps) {
            nextStep();
            return;
        }

        try {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // 1. Create Work Order
            const { data: woData, error: woError } = await supabase
                .from('work_orders')
                .insert([
                    {
                        user_id: user.id,
                        title: data.title,
                        brand: data.brand,
                        category: data.category,
                        description: data.description,
                        deadline: data.deadline,
                        priority: isUrgent() ? 'P1' : 'P2',
                        urgent_reason: data.urgentReason,
                        status: 'Open',
                        platform: data.platform,
                        dimension: data.dimension,
                    }
                ])
                .select()
                .single();

            if (woError) throw woError;

            // 2. Upload Files if any
            if (files.length > 0) {
                for (const file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${user.id}/${woData.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error("Upload error:", uploadError);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(filePath);

                    // 3. Save attachment record
                    await supabase
                        .from('work_order_attachments')
                        .insert([
                            {
                                wo_id: woData.id,
                                file_url: publicUrl,
                                file_type: file.type
                            }
                        ]);
                }
            }

            alert("Work Order berhasil dibuat!");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error submitting WO:", error.message);
            alert("Gagal mengirim Work Order: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full glass border-b border-border">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                        <div className="bg-primary text-primary-foreground p-1 rounded">
                            <Layout size={20} />
                        </div>
                        <span>WorkOrder2026</span>
                    </Link>
                    <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                        Batal & Keluar
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-6 pt-32 max-w-3xl">
                {/* Progress Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Buat Work Order</h1>
                            <p className="text-muted-foreground mt-1">Lengkapi detail permintaan Anda secara bertahap.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Step {step} of {totalSteps}</span>
                            <div className="flex gap-1 mt-2">
                                {[1, 2, 3, 4].map((s) => (
                                    <div
                                        key={s}
                                        className={`h-1.5 w-8 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 lg:p-12">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Dasar */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Layout size={20} className="text-primary" /> Informasi Dasar
                                        </h2>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Judul Pekerjaan</label>
                                                <input
                                                    {...register("title")}
                                                    placeholder="Contoh: Revisi Banner Promo Website"
                                                    className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                                {errors.title && <p className="text-red-500 text-xs mt-1 font-medium">{errors.title.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Brand / Project</label>
                                                <input
                                                    {...register("brand")}
                                                    placeholder="Nama Brand atau Nama Project Utama"
                                                    className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                                {errors.brand && <p className="text-red-500 text-xs mt-1 font-medium">{errors.brand.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-4">Kategori Layanan</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {[
                                                        { id: "Design", icon: PenTool, label: "Creative Design" },
                                                        { id: "Programming", icon: Code2, label: "IT / Programming" },
                                                        { id: "Asset", icon: Database, label: "Asset Management" },
                                                    ].map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setValue("category", cat.id as any)}
                                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedCategory === cat.id
                                                                ? "border-primary bg-primary/5 text-primary"
                                                                : "border-border hover:border-zinc-300 dark:hover:border-zinc-700"
                                                                }`}
                                                        >
                                                            <cat.icon size={24} />
                                                            <span className="text-xs font-bold text-center">{cat.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Detail Berdasarkan Kategori */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <CheckCircle2 size={20} className="text-primary" /> Detail Pekerjaan
                                        </h2>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Deskripsi Lengkap / Brief</label>
                                                <textarea
                                                    {...register("description")}
                                                    rows={5}
                                                    placeholder="Jelaskan secara detail apa yang perlu dikerjakan..."
                                                    className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                                />
                                                {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description.message}</p>}
                                            </div>

                                            {selectedCategory === "Design" && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                    <label className="block text-sm font-semibold mb-2">Dimensi / Ukuran (Opsional)</label>
                                                    <input
                                                        {...register("dimension")}
                                                        placeholder="Contoh: 1080x1080px (Instagram)"
                                                        className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    />
                                                </motion.div>
                                            )}

                                            {selectedCategory === "Programming" && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                    <label className="block text-sm font-semibold mb-2">Platform</label>
                                                    <input
                                                        {...register("platform")}
                                                        placeholder="Contoh: Admin Panel / Mobile App"
                                                        className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Timeline & SLA Warning */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Calendar size={20} className="text-primary" /> Timeline & Urgency
                                        </h2>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Target Deadline</label>
                                                <input
                                                    {...register("deadline")}
                                                    type="date"
                                                    className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    SOP: Timeline standar pengerjaan adalah 3-7 hari kerja.
                                                </p>
                                            </div>

                                            {isUrgent() && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    className="p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20"
                                                >
                                                    <div className="flex gap-3 mb-4">
                                                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-red-700 dark:text-red-400">SLA Warning: Permintaan Mendesak</h4>
                                                            <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">
                                                                Anda memilih deadline kurang dari 3 hari. Mohon berikan alasan mendesak untuk triaging prioritas (P1).
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        {...register("urgentReason")}
                                                        rows={3}
                                                        placeholder="Contoh: Brief dari Owner untuk tayang malam ini..."
                                                        className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none text-sm"
                                                    />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Attachment & Review */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <FileUp size={20} className="text-primary" /> Lampiran & Referensi
                                        </h2>
                                        <div className="space-y-6">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                                    <div className="p-4 rounded-full bg-secondary text-muted-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                        <FileUp size={32} />
                                                    </div>
                                                    <h4 className="font-bold">Upload File Referensi</h4>
                                                    <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                                                        Drag & drop atau klik untuk upload brief/gambar referensi. (Max 10MB)
                                                    </p>
                                                </div>
                                            </div>

                                            {files.length > 0 && (
                                                <div className="grid grid-cols-1 gap-2 mt-4">
                                                    {files.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-border">
                                                            <div className="flex items-center gap-3">
                                                                <FileUp size={16} className="text-primary" />
                                                                <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(idx)}
                                                                className="text-red-500 hover:text-red-700 transition-colors text-xs font-bold"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-border">
                                                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                                    Konfirmasi SOP
                                                </h4>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1">
                                                        <input
                                                            type="checkbox"
                                                            {...register("confirmSOP")}
                                                            className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        Saya mengerti bahwa pengerjaan baru akan dimulai setelah tiket ini diverifikasi oleh Head of Division (Status: Triaging).
                                                    </p>
                                                </div>
                                                {errors.confirmSOP && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.confirmSOP.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Actions */}
                        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex items-center gap-2 px-6 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ChevronLeft size={20} /> Sebelumnya
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                    Lanjut <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="group flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                >
                                    {isUploading ? "Mengirim..." : "Kirim Work Order"} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
