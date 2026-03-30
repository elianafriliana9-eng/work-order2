"use client";

import { useEffect, useState } from "react";
import {
    Smartphone,
    Plus,
    Trash2,
    Upload,
    X,
    ExternalLink,
    Globe,
    Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface AppShowcase {
    id: string;
    app_name: string;
    description: string;
    screenshots: string[];
    platform: string;
    play_store_url: string | null;
    app_store_url: string | null;
    demo_url: string | null;
    created_at: string;
}

const PLATFORMS = [
    { value: "android", label: "Android" },
    { value: "ios", label: "iOS" },
    { value: "web", label: "Web App" },
    { value: "cross-platform", label: "Cross Platform" },
];

function PlatformBadge({ platform }: { platform: string }) {
    const colors: Record<string, string> = {
        android: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        ios: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        web: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        "cross-platform": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    const labels: Record<string, string> = {
        android: "Android",
        ios: "iOS",
        web: "Web App",
        "cross-platform": "Cross Platform",
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colors[platform] || colors.web}`}>
            {labels[platform] || platform}
        </span>
    );
}

export default function AdminAppShowcasePage() {
    const [items, setItems] = useState<AppShowcase[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [appName, setAppName] = useState("");
    const [description, setDescription] = useState("");
    const [platform, setPlatform] = useState("android");
    const [playStoreUrl, setPlayStoreUrl] = useState("");
    const [appStoreUrl, setAppStoreUrl] = useState("");
    const [demoUrl, setDemoUrl] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // Preview modal
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    async function loadItems() {
        setLoading(true);
        const { data } = await supabase
            .from("app_showcase")
            .select("*")
            .order("created_at", { ascending: false });

        if (data) setItems(data);
        setLoading(false);
    }

    useEffect(() => {
        loadItems();
    }, []);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files || []);
        const valid: File[] = [];
        for (const f of selected) {
            if (f.size > 5 * 1024 * 1024) {
                alert(`File "${f.name}" melebihi 5MB, dilewati.`);
                continue;
            }
            valid.push(f);
        }
        if (files.length + valid.length > 6) {
            alert("Maksimal 6 screenshot per aplikasi.");
            return;
        }
        const newFiles = [...files, ...valid];
        setFiles(newFiles);
        setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
        e.target.value = "";
    }

    function removeFile(index: number) {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();

        if (files.length === 0) {
            alert("Harap upload minimal 1 screenshot.");
            return;
        }

        setSubmitting(true);
        try {
            // Upload all screenshots
            const uploadedUrls: string[] = [];
            for (const file of files) {
                const fileExt = file.name.split(".").pop();
                const fileName = `app-showcase/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("attachments")
                    .upload(fileName, file, { cacheControl: "3600", upsert: false });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from("attachments")
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            }

            // Insert to Database
            const { error: dbError } = await supabase
                .from("app_showcase")
                .insert([{
                    app_name: appName,
                    description,
                    screenshots: uploadedUrls,
                    platform,
                    play_store_url: playStoreUrl || null,
                    app_store_url: appStoreUrl || null,
                    demo_url: demoUrl || null,
                }]);

            if (dbError) throw dbError;

            // Reset form
            setAppName("");
            setDescription("");
            setPlatform("android");
            setPlayStoreUrl("");
            setAppStoreUrl("");
            setDemoUrl("");
            setFiles([]);
            setPreviewUrls([]);
            loadItems();
        } catch (error: any) {
            alert("Gagal menambah app showcase: " + error.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Yakin ingin menghapus app showcase ini?")) return;

        const { error } = await supabase
            .from("app_showcase")
            .delete()
            .eq("id", id);

        if (error) {
            alert("Gagal menghapus: " + error.message);
        } else {
            setItems(items.filter((item) => item.id !== id));
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Smartphone size={24} /> App Showcase Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Kelola portofolio aplikasi/sistem yang dikembangkan tim IT Development.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Add New */}
                <div className="lg:col-span-1">
                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-border sticky top-6">
                        <h2 className="font-bold mb-4 flex items-center gap-2">
                            <Plus size={18} /> Tambah Aplikasi Baru
                        </h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">Nama Aplikasi</label>
                                <input
                                    required
                                    value={appName}
                                    onChange={(e) => setAppName(e.target.value)}
                                    placeholder="Contoh: WorkOrder System"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">Deskripsi</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Deskripsi singkat tentang aplikasi..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">Platform</label>
                                <select
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {PLATFORMS.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Store Links */}
                            <div className="space-y-3 pt-2 border-t border-border">
                                <p className="text-xs font-bold text-muted-foreground pt-1">Link Download / Demo (opsional)</p>
                                {(platform === "android" || platform === "cross-platform") && (
                                    <div>
                                        <label className="block text-[10px] font-bold mb-1 text-green-600 dark:text-green-400 uppercase tracking-wider">
                                            Google Play Store
                                        </label>
                                        <input
                                            value={playStoreUrl}
                                            onChange={(e) => setPlayStoreUrl(e.target.value)}
                                            placeholder="https://play.google.com/store/apps/..."
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                )}
                                {(platform === "ios" || platform === "cross-platform") && (
                                    <div>
                                        <label className="block text-[10px] font-bold mb-1 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                            Apple App Store
                                        </label>
                                        <input
                                            value={appStoreUrl}
                                            onChange={(e) => setAppStoreUrl(e.target.value)}
                                            placeholder="https://apps.apple.com/app/..."
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] font-bold mb-1 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                        Demo / Web URL
                                    </label>
                                    <input
                                        value={demoUrl}
                                        onChange={(e) => setDemoUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Screenshot Upload */}
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">
                                    Screenshots (Max 6, masing-masing max 5MB)
                                </label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    multiple
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-all cursor-pointer bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                                />
                                {previewUrls.length > 0 && (
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        {previewUrls.map((url, i) => (
                                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(i)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {submitting ? "Menyimpan..." : "Simpan Aplikasi"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Items */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="p-10 flex justify-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                            <Smartphone size={40} className="mx-auto mb-3 text-zinc-300" />
                            <p className="font-bold">Belum ada App Showcase</p>
                            <p className="text-sm text-muted-foreground">Tambahkan aplikasi baru melalui form di samping.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative overflow-hidden rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-base">{item.app_name}</h3>
                                                    <PlatformBadge platform={item.platform} />
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md shrink-0 ml-4"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Screenshots Grid */}
                                        {item.screenshots && item.screenshots.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin">
                                                {item.screenshots.map((url, si) => (
                                                    <div
                                                        key={si}
                                                        className="shrink-0 w-32 aspect-video rounded-lg overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                                                        onClick={() => setSelectedImage(url)}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={url}
                                                            alt={`${item.app_name} screenshot ${si + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => (e.currentTarget.src = "https://placehold.co/400x225/27272a/fafafa?text=Image+Broken")}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Links */}
                                        <div className="flex flex-wrap gap-2">
                                            {item.play_store_url && (
                                                <a
                                                    href={item.play_store_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                                >
                                                    <ExternalLink size={12} /> Play Store
                                                </a>
                                            )}
                                            {item.app_store_url && (
                                                <a
                                                    href={item.app_store_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                                >
                                                    <ExternalLink size={12} /> App Store
                                                </a>
                                            )}
                                            {item.demo_url && (
                                                <a
                                                    href={item.demo_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                                >
                                                    <Globe size={12} /> Demo
                                                </a>
                                            )}
                                            {!item.play_store_url && !item.app_store_url && !item.demo_url && (
                                                <span className="text-xs text-muted-foreground italic">Belum ada link download/demo</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={24} />
                        </motion.button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            src={selectedImage}
                            alt="Full Preview"
                            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain bg-zinc-900"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
