"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layout, ArrowLeft, ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ADMIN_ROLES, DEFAULT_REDIRECTS } from "@/lib/constants";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [origin, setOrigin] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        // Set origin on client side to ensure correct callback URL
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin);
        }
    }, []);

    async function handleGoogleLogin() {
        try {
            const callbackUrl = `${origin || window.location.origin}/auth/callback`;
            console.log("Login: Initiating Google OAuth with callback:", callbackUrl);
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: callbackUrl,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            console.error("Error logging in with Google:", error.message);
            setError("Gagal login dengan Google. Cek konfigurasi Supabase.");
        }
    }

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error, data: authData } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (authData.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                const redirectPath = (profile && ADMIN_ROLES.includes(profile.role as any))
                    ? DEFAULT_REDIRECTS.ADMIN
                    : DEFAULT_REDIRECTS.USER;

                router.push(redirectPath);
                router.refresh();
            }
        } catch (error: any) {
            console.error("Login Error:", error.message);
            setError("Email atau password salah.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 w-fit mx-auto sm:mx-0"
                >
                    <ArrowLeft size={16} /> Kembali ke Landing Page
                </Link>
                <div className="flex justify-center mb-6">
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-lg ring-4 ring-primary/10">
                        <Layout size={32} />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground">
                    Work Order System
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Gunakan akun domain perusahaan atau login Admin.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4"
            >
                <div className="bg-white dark:bg-zinc-900 py-10 px-6 shadow-xl shadow-zinc-200/50 dark:shadow-none sm:rounded-3xl border border-border">
                    <div className="space-y-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-4 py-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-800 text-black dark:text-white font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm group"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            Masuk dengan Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-zinc-900 text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                                    Atau Login Manual
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="user@it.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-zinc-50 dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !email || !password}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : "Masuk"}
                            </button>
                        </form>

                        <div className="grid grid-cols-1 gap-4 text-xs pt-2">
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-border">
                                <ShieldCheck className="text-primary shrink-0" size={18} />
                                <div>
                                    <p className="font-bold text-foreground">Keamanan Terjamin</p>
                                    <p className="text-muted-foreground mt-0.5">Session dienkripsi dengan standar Supabase SSR.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed px-4">
                    Punya masalah login? 
                    <Link href="#" className="text-primary font-medium hover:underline ml-1"> Hubungi IT Support </Link>
                </p>
            </motion.div>
        </div>
    );
}
