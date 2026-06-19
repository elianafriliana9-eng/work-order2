"use client";

import { useState, useEffect, useRef } from "react";
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
    MapPin,
    PaintBucket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
    getHolidayDates,
    getDefaultDeadline,
    countWorkingDays,
    isDateAllowed,
    isWorkingDay,
    addWorkingDays,
    type Holiday,
} from "@/lib/working-days";

// --- Schema Definitions ---

const formSchema = z.object({
    title: z.string().min(5, "Judul minimal 5 karakter"),
    brand: z.string().min(1, "Brand harus dipilih"),
    category: z.enum(["Design", "Programming", "Asset"]),
    // Step 2: Conditional
    concept: z.string().min(10, "Konsep minimal 10 karakter"),
    primaryColor: z.string().min(1, "Warna primer harus diisi"),
    secondaryColor: z.string().min(1, "Warna sekunder harus diisi"),
    description: z.string().refine(val => {
        const wordCount = val.trim().split(/\s+/).filter(word => word.length > 0).length;
        return wordCount >= 25;
    }, "Materi / Brief minimal 25 kata agar instruksi lebih jelas"),
    platform: z.string().optional(),
    dimension: z.string().optional(),
    taskType: z.enum(["Bug Fix", "New Feature", "Maintenance", "Develop New System"]).optional(),
    moduleAffected: z.string().optional(),
    reproductionSteps: z.string().optional(),
    userFlow: z.string().optional(),
    credentials: z.string().optional(),
    // Step 3: Meeting integration (Placeholder for LiveKit later)
    meetingType: z.enum(["Offline", "Online"]),
    meetingDate: z.string().min(1, "Jadwal meeting harus dipilih"),
    // Step 4
    deadline: z.string(),
    urgentReason: z.string().optional(),
    // Step 5
    confirmSOP: z.boolean().refine(v => v === true, "Anda harus mengonfirmasi SOP"),
});

type FormValues = z.infer<typeof formSchema>;

const ColorPicker = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
    const colorRef = useRef<HTMLInputElement>(null);
    const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value);
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => colorRef.current?.showPicker()}
                className="w-10 h-10 shrink-0 rounded-xl border-2 border-border cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: isValidHex ? value : '#e4e4e7' }}
                aria-label="Pilih warna"
            />
            <input
                ref={colorRef}
                type="color"
                value={isValidHex ? value : '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
            />
            <div className="relative flex-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all text-sm pr-10"
                />
                <PaintBucket size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
};

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
            deadline: "",
        }
    });

    const selectedCategory = watch("category");
    const selectedDeadline = watch("deadline");
    const selectedMeetingType = watch("meetingType");

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());
    const [deadlineWarning, setDeadlineWarning] = useState<string | null>(null);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        supabase
            .from('holidays')
            .select('*')
            .gte('year', currentYear)
            .lte('year', currentYear + 1)
            .order('date', { ascending: true })
            .then(({ data }: { data: Holiday[] | null }) => {
                if (data) {
                    setHolidays(data);
                    setHolidayDates(getHolidayDates(data));
                }
            });
    }, []);

    const isUrgent = () => {
        if (!selectedDeadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(selectedDeadline + 'T00:00:00');
        const workingDays = countWorkingDays(today, deadlineDate, holidayDates);
        return workingDays < 3;
    };

    useEffect(() => {
        if (!selectedDeadline) {
            setDeadlineWarning(null);
            return;
        }
        const d = new Date(selectedDeadline + 'T00:00:00');
        const check = isDateAllowed(d, holidayDates);
        
        // Cek apakah kurang dari 2 hari kerja
        const today = new Date();
        today.setHours(0,0,0,0);
        const minAllowedDate = addWorkingDays(today, 2, holidayDates);
        
        if (!check.allowed) {
            setDeadlineWarning(check.reason || 'Tanggal tidak valid');
        } else if (d < minAllowedDate) {
            setDeadlineWarning('SOP Pengajuan Tiket P1/Urgent minimal 2 Hari Kerja (Sabtu, Minggu, & Libur Nasional tidak dihitung)');
        } else {
            setDeadlineWarning(null);
        }
    }, [selectedDeadline, holidayDates]);

    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [formReady, setFormReady] = useState(false);

    useEffect(() => {
        if (holidays.length > 0 && !formReady) {
            setValue('deadline', format(getDefaultDeadline(holidayDates), "yyyy-MM-dd"));
            setFormReady(true);
        }
    }, [holidays, holidayDates, formReady, setValue]);

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
        else if (step === 2) {
            if (selectedCategory === "Design") {
                fieldsToValidate = ["concept", "primaryColor", "secondaryColor", "description", "dimension"];
            } else {
                fieldsToValidate = ["description", "platform", "dimension"];
            }
        }
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

            // Online Meeting: Default to internal LiveKit room name (using ticket ID later)
            let meetingLink = null;
            if (data.meetingType === "Online") {
                // Placeholder link for LiveKit internal room
                meetingLink = `/dashboard/meeting/${Math.random().toString(36).substring(7)}`;
            }

            // 1. Create Work Order
            const insertData: any = {
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
                meeting_date: data.meetingDate ? `${data.meetingDate}:00+07:00` : null,
                meeting_link: meetingLink,
            };

            // Design-specific fields
            if (data.category === 'Design') {
                insertData.concept = data.concept;
                insertData.primary_color = data.primaryColor;
                insertData.secondary_color = data.secondaryColor;
            }

            // Programming-specific fields
            if (data.category === 'Programming') {
                insertData.task_type = data.taskType || null;
                insertData.module_affected = data.moduleAffected || null;
                insertData.reproduction_steps = data.reproductionSteps || null;
                insertData.user_flow = data.userFlow || null;
                insertData.credentials = data.credentials || null;
            }

            const { data: woData, error: woError } = await supabase
                .from('work_orders')
                .insert([insertData])
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
                    <Link href="/dashboard" className="flex items-center">
                        <Image src="/logo.png" alt="Digital Technology" width={260} height={65} className="h-12 w-auto object-contain" />
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
                                                <select {...register("brand")} className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all">
                                                    <option value="">Pilih Brand / Project</option>
                                                    <option value="Head Office">Head Office</option>
                                                    <option value="Kingtech">Kingtech</option>
                                                    <option value="Pioneer Wrap">Pioneer Wrap</option>
                                                    <option value="Galaxy Port">Galaxy Port</option>
                                                    <option value="Robust Pack">Robust Pack</option>
                                                    <option value="First Secure">First Secure</option>
                                                    <option value="Starwrap">Starwrap</option>
                                                    <option value="Urban">Urban</option>
                                                    <option value="Latte story">Latte story</option>
                                                    <option value="Papimart">Papimart</option>
                                                    <option value="Point one">Point one</option>
                                                    <option value="Bekal yuk">Bekal yuk</option>
                                                    <option value="M mart">M mart</option>
                                                    <option value="Papicoffe">Papicoffe</option>
                                                    <option value="Serenity Blossom">Serenity Blossom</option>
                                                    <option value="Datacell">Datacell</option>
                                                    <option value="Pointcell">Pointcell</option>
                                                    <option value="Kingcell">Kingcell</option>
                                                    <option value="Telkomsel">Telkomsel</option>
                                                </select>
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

                                            {selectedCategory === "Design" && (
                                                <>
                                                    {/* Example Card */}
                                                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
                                                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                                            <CheckCircle2 size={14} />
                                                            Contoh Pengisian Detail Design
                                                        </p>
                                                        <div className="space-y-2 text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                                                            <p><strong className="text-indigo-800 dark:text-indigo-200">Konsep:</strong> Desain minimalis elegan dengan nuansa premium untuk banner promo akhir tahun. Menggabungkan elemen garis tipis dan tipografi modern.</p>
                                                            <p><strong className="text-indigo-800 dark:text-indigo-200">Warna Primer:</strong> #1A365D (Biru Navy) — sebagai warna dominan background</p>
                                                            <p><strong className="text-indigo-800 dark:text-indigo-200">Warna Sekunder:</strong> #FFD700 (Emas) — untuk aksen dan highlight</p>
                                                            <p><strong className="text-indigo-800 dark:text-indigo-200">Brief / Materi:</strong>Pembuatan Video display untuk pricelist, orientasi potrait left, warna dominan terlampir. dengan materi sebagai berikut:
                                                            produk A = 150.000
                                                            produk B = 200.000
                                                            dst.
                                                            setiap slide minimal berdurasi 5-7 detik, slide pertama logo dan ucapan welcome</p>
                                                        </div>
                                                    </div>

                                                    {/* Concept */}
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Konsep <span className="text-red-500">*</span></label>
                                                        <textarea {...register("concept")} rows={3} placeholder="Jelaskan konsep desain yang diinginkan. Contoh: Desain minimalis elegan dengan nuansa premium..." className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                        {errors.concept && <p className="text-red-500 text-xs mt-1">{errors.concept.message}</p>}
                                                    </div>

                                                    {/* Primary Color */}
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Warna Primer <span className="text-red-500">*</span></label>
                                                        <ColorPicker
                                                            value={watch("primaryColor") || ""}
                                                            onChange={(v) => setValue("primaryColor", v)}
                                                            placeholder="#1A365D atau Biru Navy"
                                                        />
                                                        {errors.primaryColor && <p className="text-red-500 text-xs mt-1">{errors.primaryColor.message}</p>}
                                                    </div>

                                                    {/* Secondary Color */}
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Warna Sekunder <span className="text-red-500">*</span></label>
                                                        <ColorPicker
                                                            value={watch("secondaryColor") || ""}
                                                            onChange={(v) => setValue("secondaryColor", v)}
                                                            placeholder="#FFD700 atau Emas"
                                                        />
                                                        {errors.secondaryColor && <p className="text-red-500 text-xs mt-1">{errors.secondaryColor.message}</p>}
                                                    </div>

                                                    {/* Brief / Materi */}
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Brief / Materi <span className="text-red-500">*</span></label>
                                                        <textarea {...register("description")} rows={5} placeholder="Jelaskan secara detail materi/brief yang perlu dikerjakan. Sertakan informasi platform, dimensi, dan elemen-elemen yang harus ada..." className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                                    </div>

                                                    {/* Dimension (existing) */}
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Dimensi / Ukuran <span className="text-zinc-400 font-normal">(Opsional)</span></label>
                                                        <input {...register("dimension")} placeholder="Contoh: 1080x1080px (Instagram)" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none" />
                                                    </div>
                                                </>
                                            )}

                                            {/* Brief for non-Design categories */}
                                            {selectedCategory !== "Design" && (
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">Deskripsi Lengkap / Brief</label>
                                                    <textarea {...register("description")} rows={5} placeholder="Jelaskan secara detail apa yang perlu dikerjakan..." className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                                </div>
                                            )}
                                            {selectedCategory === "Programming" && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Tipe Pekerjaan</label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {[
                                                                { id: "Bug Fix", label: "Bug Fix", desc: "Perbaikan error/bug pada sistem" },
                                                                { id: "New Feature", label: "New Feature", desc: "Tambah fitur baru ke sistem yang ada" },
                                                                { id: "Maintenance", label: "Maintenance", desc: "Pemeliharaan & update rutin" },
                                                                { id: "Develop New System", label: "Develop New System", desc: "Bangun sistem/aplikasi baru" },
                                                            ].map((type) => (
                                                                <button
                                                                    key={type.id}
                                                                    type="button"
                                                                    onClick={() => setValue("taskType", type.id as any)}
                                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${watch("taskType") === type.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-zinc-300 dark:hover:border-zinc-700"}`}
                                                                >
                                                                    <span className="text-sm font-bold block">{type.label}</span>
                                                                    <span className="text-[10px] text-muted-foreground">{type.desc}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {watch("taskType") && (
                                                        <>
                                                            <div>
                                                                <label className="block text-sm font-semibold mb-2">Platform</label>
                                                                <input {...register("platform")} placeholder="Contoh: Web / Mobile / Database Internal" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all" />
                                                            </div>

                                                            {/* Bug Fix: Modul + Langkah Reproduksi */}
                                                            {watch("taskType") === "Bug Fix" && (
                                                                <>
                                                                    <div>
                                                                        <label className="block text-sm font-semibold mb-2">Modul yang Terkena</label>
                                                                        <input {...register("moduleAffected")} placeholder="Contoh: Modul Login, Halaman Dashboard, API Payment" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-semibold mb-2">Langkah Reproduksi Bug</label>
                                                                        <textarea {...register("reproductionSteps")} rows={4} placeholder={"Jelaskan langkah-langkah untuk mereproduksi bug:\n1. Buka halaman ...\n2. Klik tombol ...\n3. Muncul error ..."} className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                                    </div>
                                                                </>
                                                            )}

                                                            {/* New Feature: User Flow */}
                                                            {watch("taskType") === "New Feature" && (
                                                                <div>
                                                                    <label className="block text-sm font-semibold mb-2">Alur Kerja / User Flow</label>
                                                                    <textarea {...register("userFlow")} rows={4} placeholder={"Jelaskan alur penggunaan fitur dari sisi pengguna:\n1. User membuka halaman ...\n2. User mengisi form ...\n3. Sistem memproses dan menampilkan ..."} className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                                </div>
                                                            )}

                                                            {/* Maintenance: Modul */}
                                                            {watch("taskType") === "Maintenance" && (
                                                                <div>
                                                                    <label className="block text-sm font-semibold mb-2">Modul / Sistem yang Perlu Maintenance</label>
                                                                    <input {...register("moduleAffected")} placeholder="Contoh: Server Database, API Gateway, CMS Backend" className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all" />
                                                                </div>
                                                            )}

                                                            {/* Develop New System: User Flow */}
                                                            {watch("taskType") === "Develop New System" && (
                                                                <div>
                                                                    <label className="block text-sm font-semibold mb-2">Alur Kerja / User Flow Sistem Baru</label>
                                                                    <textarea {...register("userFlow")} rows={4} placeholder={"Jelaskan alur kerja sistem yang diinginkan:\n1. Admin login ke dashboard ...\n2. Admin bisa mengelola data ...\n3. User bisa melihat ..."} className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                                </div>
                                                            )}

                                                            <div>
                                                                <label className="block text-sm font-semibold mb-2">Kredensial / Akses (Opsional)</label>
                                                                <textarea {...register("credentials")} rows={3} placeholder="URL staging, login test, atau akses lain yang diperlukan tim dev..." className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                                                                <p className="text-xs text-muted-foreground mt-1">Info ini hanya dapat dilihat oleh tim IT.</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Meeting Schedule */}
                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><Users size={20} className="text-primary" /> Jadwal Face-to-Face Meeting</h2>
                                        <p className="text-sm text-muted-foreground italic">Pilih jadwal untuk mendiskusikan brief secara langsung dengan tim.</p>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            {[
                                                { id: "Online", icon: Video, label: "Online Meeting", sub: "Via LiveKit (Internal)" },
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
                                                <span>Room video call internal (LiveKit) akan otomatis dibuat untuk tiket ini.</span>
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
                                            <input {...register("deadline")} type="date" min={format(addWorkingDays(new Date(), 2, holidayDates), 'yyyy-MM-dd')} className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none" />

                                            {deadlineWarning && (
                                                <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                                                    <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                                                        <AlertCircle size={14} />
                                                        {deadlineWarning}
                                                    </p>
                                                </div>
                                            )}

                                            {!deadlineWarning && selectedDeadline && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Perhitungan SLA berdasarkan <strong>hari kerja</strong> (Senin-Jumat, tidak termasuk hari libur nasional).
                                                </p>
                                            )}

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
                                        <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center relative hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <input type="file" multiple onChange={handleFileChange} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                                            <FileUp size={32} className="mx-auto text-muted-foreground mb-4" />
                                            <p className="font-bold">Upload Referensi</p>
                                            <p className="text-xs text-muted-foreground mt-1">Gunakan file gambar, PDF, atau Word.</p>
                                        </div>

                                        {/* File Preview List */}
                                        {files.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                                                    <CheckCircle2 size={14} /> {files.length} file terpilih
                                                </p>
                                                {files.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-border">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                                                <FileUp size={14} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold truncate">{file.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                            Hapus
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

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
