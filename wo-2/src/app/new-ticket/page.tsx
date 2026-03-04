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
    ArrowRight,
    Video,
    Users,
    MapPin
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
    taskType: z.enum(["Bug Fix", "New Feature", "Maintenance", "Develop New System"]).optional(),
    moduleAffected: z.string().optional(),
    reproductionSteps: z.string().optional(),
    credentials: z.string().optional(),
    // Step 3: Meeting Integration
    meetingType: z.enum(["Offline", "Online"]),
    meetingDate: z.string().min(1, "Jadwal meeting harus dipilih"),
    // Step 4
    deadline: z.string(),
    urgentReason: z.string().optional(),
    // Step 5
    confirmSOP: z.boolean().refine(v => v === true, "Anda harus mengonfirmasi SOP"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTicketPage() {
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        trigger,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "Design",
            meetingType: "Online",
            deadline: format(addDays(new Date(), 3), "yyyy-MM-dd"),
        }
    });

    const selectedCategory = watch("category");
    const selectedDeadline = watch("deadline");
    const selectedMeetingType = watch("meetingType");

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
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/jpg', 'application/pdf',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            const filteredFiles = newFiles.filter(file => {
                if (!allowedTypes.includes(file.type)) {
                    alert(`File ${file.name} ditolak. Hanya file gambar, PDF, atau Word yang diizinkan.`);
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

    const nextStep = async () => {
        let fieldsToValidate: (keyof FormValues)[] = [];
        if (step === 1) fieldsToValidate = ["title", "brand", "category"];
        else if (step === 2) fieldsToValidate = ["description", "platform", "dimension"];
        else if (step === 3) fieldsToValidate = ["meetingType", "meetingDate"];
        else if (step === 4) fieldsToValidate = ["deadline", "urgentReason"];

        const isStepValid = await trigger(fieldsToValidate);
        if (isStepValid) {
            setStep((s) => Math.min(s + 1, totalSteps));
        }
    };
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const router = useRouter();

    const onSubmit = async (data: FormValues) => {
        if (step < totalSteps) {
            await nextStep();
            return;
        }

        try {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Online Meeting Integration: Generate Mock Google Meet Link
            let meetingLink = null;
            if (data.meetingType === "Online") {
                meetingLink = `https://meet.google.com/new-${Math.random().toString(36).substring(7)}`;
            }

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
                        meeting_type: data.meetingType,
                        meeting_date: data.meetingDate,
                        meeting_link: meetingLink
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
                    const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
                    if (uploadError) continue;

                    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
                    await supabase.from('work_order_attachments').insert([{
                        wo_id: woData.id,
                        file_url: publicUrl,
                        file_type: file.type
                    }]);
                }
            }

            alert("Work Order & Jadwal Meeting berhasil dibuat!");
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
            <nav className="fixed top-0 z-50 w-full glass border-b border-border">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                        <div className="bg-primary text-primary-foreground p-1 rounded"><Layout size={20} /></div>
                        <span>WorkOrder <span className="text-muted-foreground font-normal">System</span></span>
                    </Link>
                    <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Batal & Keluar</Link>
                </div>
            </nav>

            <main className="container mx-auto px-6 pt-32 max-w-3xl">
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Buat Work Order</h1>
                            <p className="text-muted-foreground mt-1">Lengkapi detail permintaan Anda secara bertahap.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Step {step} of {totalSteps}</span>
                            <div className="flex gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-xl overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 lg:p-12">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Dasar */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><Layout size={20} className="text-primary" /> Informasi Dasar</h2>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Judul Pekerjaan</label>
                                                <input {...register("title")} placeholder="Contoh: Revisi Banner Promo Website" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all" />
                                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Brand / Project</label>
                                                <input {...register("brand")} placeholder="Nama Brand atau Nama Project Utama" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all" />
                                                {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-4">Kategori Layanan</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {[
                                                        { id: "Design", icon: PenTool, label: "Creative Design" },
                                                        { id: "Programming", icon: Code2, label: "IT / Programming" },
                                                        { id: "Asset", icon: Database, label: "Asset Management" },
                                                    ].map((cat) => (
                                                        <button key={cat.id} type="button" onClick={() => setValue("category", cat.id as any)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedCategory === cat.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
                                                            <cat.icon size={24} /> <span className="text-xs font-bold">{cat.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Detail */}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 size={20} className="text-primary" /> Detail Pekerjaan</h2>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Deskripsi Lengkap / Brief</label>
                                                <textarea {...register("description")} rows={5} placeholder="Jelaskan secara detail apa yang perlu dikerjakan..." className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                            </div>
                                            {selectedCategory === "Design" && (
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">Dimensi / Ukuran (Opsional)</label>
                                                    <input {...register("dimension")} placeholder="Contoh: 1080x1080px (Instagram)" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Face to Face Meeting Integration */}
                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><Users size={20} className="text-primary" /> Jadwal Face-to-Face Meeting</h2>
                                        <p className="text-sm text-muted-foreground italic">Pilih jadwal untuk mendiskusikan brief secara langsung dengan tim.</p>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            {[
                                                { id: "Online", icon: Video, label: "Online Meeting", sub: "Via Google Meet" },
                                                { id: "Offline", icon: MapPin, label: "Offline / In-Person", sub: "Di Kantor IT" },
                                            ].map((type) => (
                                                <button key={type.id} type="button" onClick={() => setValue("meetingType", type.id as any)} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${selectedMeetingType === type.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
                                                    <type.icon size={28} />
                                                    <div className="text-center">
                                                        <span className="text-sm font-bold block">{type.label}</span>
                                                        <span className="text-[10px] opacity-60 uppercase font-black tracking-widest">{type.sub}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Pilih Tanggal & Waktu</label>
                                            <input {...register("meetingDate")} type="datetime-local" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-primary outline-none transition-all" />
                                            {errors.meetingDate && <p className="text-red-500 text-xs mt-1">{errors.meetingDate.message}</p>}
                                        </div>

                                        {selectedMeetingType === "Online" && (
                                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-3">
                                                <Video size={16} />
                                                <span>Link meeting otomatis akan tersedia di dalam ticket setelah Anda mengirim form ini.</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Timeline */}
                            {step === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><Calendar size={20} className="text-primary" /> Timeline & Urgency</h2>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Target Deadline</label>
                                            <input {...register("deadline")} type="date" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none" />
                                            {isUrgent() && (
                                                <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20">
                                                    <p className="text-xs font-bold text-red-600 mb-2">Alasan Urgent (P1)</p>
                                                    <textarea {...register("urgentReason")} rows={2} placeholder="Kenapa deadline ini mendesak?" className="w-full px-3 py-2 text-sm rounded-lg border border-red-100 outline-none" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 5: Attachment */}
                            {step === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><FileUp size={20} className="text-primary" /> Lampiran & Review</h2>
                                        <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center relative hover:bg-zinc-50 transition-colors">
                                            <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <FileUp size={32} className="mx-auto text-muted-foreground mb-4" />
                                            <p className="font-bold">Upload Referensi</p>
                                            <p className="text-xs text-muted-foreground mt-1">Gunakan file gambar, PDF, atau Word.</p>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border">
                                            <input type="checkbox" {...register("confirmSOP")} className="mt-1" />
                                            <p className="text-xs text-muted-foreground">Saya mengonfirmasi bahwa pengerjaan dimulai setelah verifikasi Admin.</p>
                                        </div>
                                        {errors.confirmSOP && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmSOP.message}</p>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                            {step > 1 ? <button type="button" onClick={prevStep} className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft size={20} /> Sebelumnya</button> : <div />}
                            {step < totalSteps ? <button type="button" onClick={nextStep} className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 shadow-lg">Lanjut <ChevronRight size={20} /></button> : <button type="submit" disabled={isUploading} className="flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 disabled:opacity-50 shadow-lg">{isUploading ? "Mengirim..." : "Kirim Work Order"} <ArrowRight size={20} /></button>}
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
