"use client";

import { useEffect, useState, useCallback } from "react";
import {
    CalendarDays,
    Plus,
    Trash2,
    X,
    Download,
    RefreshCw,
    Search,
    Check,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getYearRange, type Holiday } from "@/lib/working-days";

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold border ${type === "success"
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                }`}
        >
            {type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            {message}
        </motion.div>
    );
}

export default function AdminHolidaysPage() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<number | null>(null);
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addDate, setAddDate] = useState("");
    const [addName, setAddName] = useState("");

    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
    }, []);

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .eq('year', filterYear)
            .order('date', { ascending: true });

        if (error) {
            showToast('Gagal memuat data: ' + error.message, 'error');
        } else {
            setHolidays(data || []);
        }
        setLoading(false);
    }, [filterYear, showToast]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleSync = async (year: number) => {
        setSyncing(year);
        try {
            const res = await fetch('/api/holidays/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Berhasil sync ${data.synced} hari libur ${year}`, 'success');
                fetchHolidays();
            } else {
                showToast('Gagal sync: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (err: any) {
            showToast('Gagal sync: ' + err.message, 'error');
        } finally {
            setSyncing(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus hari libur ini?')) return;
        try {
            const res = await fetch('/api/holidays', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Hari libur berhasil dihapus', 'success');
                fetchHolidays();
            } else {
                showToast('Gagal hapus: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (err: any) {
            showToast('Gagal hapus: ' + err.message, 'error');
        }
    };

    const handleAdd = async () => {
        if (!addDate || !addName.trim()) {
            showToast('Tanggal dan nama harus diisi', 'error');
            return;
        }
        try {
            const res = await fetch('/api/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: addDate, name: addName.trim() }),
            });
            const data = await res.json();
            if (data.holiday) {
                showToast('Hari libur berhasil ditambahkan', 'success');
                setShowAddModal(false);
                setAddDate("");
                setAddName("");
                fetchHolidays();
            } else {
                showToast('Gagal tambah: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (err: any) {
            showToast('Gagal tambah: ' + err.message, 'error');
        }
    };

    const filtered = holidays.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase())
    );

    const yearRange = getYearRange();

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
            <div className="container mx-auto px-6 pt-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-500/10 text-violet-600">
                            <CalendarDays size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Kalender Libur</h1>
                            <p className="text-sm text-muted-foreground">Kelola hari libur nasional & cuti bersama untuk perhitungan SLA hari kerja</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                    >
                        <Plus size={18} />
                        Tambah Manual
                    </button>
                </div>

                {/* Year filter & Sync buttons */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari hari libur..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-56 px-3 py-2 rounded-xl border border-border bg-white dark:bg-zinc-800 outline-none text-sm focus:ring-2 focus:ring-primary transition-all"
                        />
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(parseInt(e.target.value))}
                            className="px-3 py-2 rounded-xl border border-border bg-white dark:bg-zinc-800 outline-none text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
                        >
                            {yearRange.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        {yearRange.map(year => (
                            <button
                                key={year}
                                onClick={() => handleSync(year)}
                                disabled={syncing !== null}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white dark:bg-zinc-800 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
                            >
                                {syncing === year ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                Sync {year}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <CalendarDays size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-bold text-muted-foreground">
                                {search ? 'Tidak ditemukan' : 'Belum ada data hari libur'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {search ? 'Coba kata kunci lain' : 'Klik "Sync" untuk mengimpor dari API atau tambah manual'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-zinc-50 dark:bg-zinc-800/50">
                                        <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tanggal</th>
                                        <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nama Hari Libur</th>
                                        <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sumber</th>
                                        <th className="text-right px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((holiday, i) => (
                                        <motion.tr
                                            key={holiday.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="border-b border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <td className="px-5 py-4 font-bold whitespace-nowrap">{formatDate(holiday.date)}</td>
                                            <td className="px-5 py-4">{holiday.name}</td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${holiday.source === 'api-hari-libur'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                                    }`}>
                                                    {holiday.source === 'api-hari-libur' ? 'API' : 'Manual'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(holiday.id)}
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <RefreshCw size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Tentang Kalender Libur</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                Data hari libur digunakan untuk menghitung <strong>hari kerja</strong> (Senin-Jumat, tidak termasuk libur nasional).
                                SLA minimum 3 hari untuk design dihitung dalam hari kerja. Data bisa di-sync otomatis dari API publik
                                atau ditambahkan manual. Pastikan data selalu update di awal tahun.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Holiday Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <h3 className="text-lg font-bold">Tambah Hari Libur</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Tanggal</label>
                                    <input
                                        type="date"
                                        value={addDate}
                                        onChange={(e) => setAddDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Nama Hari Libur</label>
                                    <input
                                        type="text"
                                        value={addName}
                                        onChange={(e) => setAddName(e.target.value)}
                                        placeholder="Contoh: Cuti Bersama Idul Fitri"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleAdd}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all"
                                >
                                    Simpan
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
