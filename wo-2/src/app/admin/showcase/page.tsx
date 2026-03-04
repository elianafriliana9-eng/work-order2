export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Link as LinkIcon,
    Upload,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminShowcasePage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [title, setTitle] = useState("");
    const [brand, setBrand] = useState("");
    const [category, setCategory] = useState("Social Media");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const CATEGORIES = [
        "Social Media", "UI/UX Design", "Digital Catalog",
        "Branding", "Design Asset", "Asset", "Other"
    ];

    async function loadItems() {
        setLoading(true);
        const { data } = await supabase
            .from('showcase_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setItems(data);
        setLoading(false);
    }

    useEffect(() => {
        loadItems();
    }, []);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();

        if (!file) {
            alert("Harap pilih gambar terlebih dahulu.");
            return;
        }

        setSubmitting(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `showcase/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('attachments') // Reusing existing bucket
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(fileName);

            // Insert to Database
            const { error: dbError } = await supabase
                .from('showcase_items')
                .insert([{ title, brand, category, img_url: publicUrl }]);

            if (dbError) throw dbError;

            // Reset form
            setTitle("");
            setBrand("");
            setFile(null);
            setPreviewUrl("");
            loadItems();
        } catch (error: any) {
            alert("Gagal menambah showcase: " + error.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Yakin ingin menghapus item showcase ini?")) return;

        const { error } = await supabase
            .from('showcase_items')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Gagal menghapus showcase: " + error.message);
        } else {
            setItems(items.filter(item => item.id !== id));
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ImageIcon size={24} /> Showcase Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Kelola portofolio project yang akan ditampilkan di Landing Page utama.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Add New */}
                <div className="lg:col-span-1">
                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-border sticky top-6">
                        <h2 className="font-bold mb-4 flex items-center gap-2">
                            <Plus size={18} /> Tambah Portofolio Baru
                        </h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">Judul Project</label>
                                <input
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Contoh: Banner Promo Lebaran"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">Nama Brand/Klien</label>
                                <input
                                    required
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    placeholder="Contoh: Brand X"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">Kategori</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-muted-foreground">Upload Gambar (Max 2MB)</label>
                                <div className="mt-2">
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={(e) => {
                                            const selected = e.target.files?.[0];
                                            if (selected) {
                                                if (selected.size > 2 * 1024 * 1024) {
                                                    alert("Ukuran gambar maksimal 2MB");
                                                    e.target.value = "";
                                                    return;
                                                }
                                                setFile(selected);
                                                setPreviewUrl(URL.createObjectURL(selected));
                                            }
                                        }}
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-all cursor-pointer bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                                        required
                                    />
                                </div>
                                {previewUrl && (
                                    <div className="mt-4 relative aspect-video rounded-xl overflow-hidden border border-border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {submitting ? "Menyimpan..." : "Simpan Showcase"}
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
                            <ImageIcon size={40} className="mx-auto mb-3 text-zinc-300" />
                            <p className="font-bold">Belum ada Showcase</p>
                            <p className="text-sm text-muted-foreground">Tambahkan portofolio baru melalui form di samping.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {items.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative overflow-hidden rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm"
                                >
                                    <div
                                        className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
                                        onClick={() => setSelectedImage(item.img_url)}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.img_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            onError={(e) => (e.currentTarget.src = "https://placehold.co/600x400/27272a/fafafa?text=Image+Broken")}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                                                Lihat Gambar
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest">{item.brand}</div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                                                {item.category}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                        >
                                            <Trash2 size={14} />
                                        </button>
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
                            onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing modal
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
