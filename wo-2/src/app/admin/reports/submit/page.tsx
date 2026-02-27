"use client";

import { useEffect, useState } from "react";
import {
    Send,
    ArrowLeft,
    Ticket,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SubmitReportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState("");
    const [content, setContent] = useState("");
    const [progress, setProgress] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadTickets() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const userRole = profile?.role || 'designer';

            // Fetch assigned tickets in progress
            const { data } = await supabase
                .from('work_orders')
                .select('*')
                .or(`assigned_to.eq.${user.id},assigned_role.eq.${userRole}`)
                .in('status', ['Execution', 'Verified', 'On Progress'])
                .order('created_at', { ascending: false });

            if (data) setTickets(data);
        }
        loadTickets();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim()) {
            alert("Mohon isi laporan harian Anda.");
            return;
        }

        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('daily_reports')
            .insert([{
                user_id: user.id,
                wo_id: selectedTicket || null,
                content: content.trim(),
                progress_pct: progress,
            }]);

        if (error) {
            alert("Gagal submit laporan: " + error.message);
        } else {
            setSuccess(true);
            setTimeout(() => router.push("/admin"), 2000);
        }
        setSubmitting(false);
    }

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-1">Laporan Terkirim!</h2>
                    <p className="text-sm text-muted-foreground">Mengalihkan ke dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft size={16} /> Kembali
            </Link>

            <header className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Send size={22} /> Laporan Harian
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Submit laporan progress harian Anda. Laporan akan dikirim ke Head of IT.
                </p>
            </header>

            <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-6"
            >
                {/* Select Ticket */}
                <div>
                    <label className="block text-sm font-bold mb-2">
                        Tiket Terkait <span className="text-muted-foreground font-normal">(opsional)</span>
                    </label>
                    <select
                        value={selectedTicket}
                        onChange={(e) => setSelectedTicket(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">-- Tidak terkait tiket --</option>
                        {tickets.map((t) => (
                            <option key={t.id} value={t.id}>
                                #{t.ticket_number} — {t.title} ({t.brand})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Report Content */}
                <div>
                    <label className="block text-sm font-bold mb-2">
                        Isi Laporan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        placeholder="Apa saja yang Anda kerjakan hari ini? Jelaskan progress, kendala, dan rencana selanjutnya..."
                        className="w-full px-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        required
                    />
                </div>

                {/* Progress Slider */}
                <div>
                    <label className="block text-sm font-bold mb-2">
                        Progress Keseluruhan
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={progress}
                            onChange={(e) => setProgress(parseInt(e.target.value))}
                            className="flex-1 accent-zinc-900 dark:accent-zinc-100"
                        />
                        <span className="text-lg font-bold tabular-nums w-14 text-right">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-2">
                        <motion.div
                            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 120 }}
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send size={16} /> Kirim Laporan
                        </>
                    )}
                </button>
            </motion.form>
        </div>
    );
}
