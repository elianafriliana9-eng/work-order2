"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ArrowLeft, Loader2, ShieldAlert, RefreshCw, Video, Shield, WifiOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

const LIVEKIT_SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://203.194.114.155:7880';

export default function MeetingPage() {
    const { id: roomName } = useParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [hasConnected, setHasConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

    useEffect(() => {
        async function prepareMeeting() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
                setUserName(name);

                const resp = await fetch(`/api/livekit?room=${roomName}&username=${encodeURIComponent(name)}&userId=${encodeURIComponent(user.id)}`);
                const data = await resp.json();

                if (data.token) {
                    setToken(data.token);
                } else {
                    throw new Error(data.error || "Gagal mendapatkan token meeting");
                }
            } catch (err: any) {
                console.error("Meeting Error:", err);
                setError(err.message);
            }
        }

        if (roomName) prepareMeeting();
    }, [roomName, router]);

    // Error State
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative max-w-md w-full"
                >
                    <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
                    <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-10 text-center shadow-2xl">
                        <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-2xl flex items-center justify-center">
                            <WifiOff size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Koneksi Gagal</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">{error}</p>
                        <div className="flex gap-3 mt-8 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-lg"
                            >
                                <RefreshCw size={16} /> Coba Lagi
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all flex items-center gap-2"
                            >
                                <ArrowLeft size={16} /> Kembali
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Loading State
    if (!token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="relative w-20 h-20 mx-auto mb-8">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="relative w-20 h-20 bg-zinc-800/80 backdrop-blur rounded-full flex items-center justify-center border border-zinc-700">
                            <Video size={32} className="text-primary" />
                        </div>
                    </div>
                    <p className="text-white font-bold text-lg mb-2">Menyiapkan Ruangan</p>
                    <p className="text-zinc-500 text-sm">Menghubungkan ke server meeting...</p>
                    <div className="flex gap-1 justify-center mt-6">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 bg-primary rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // Meeting Room
    return (
        <div className="h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col overflow-hidden">
            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/60 backdrop-blur-xl z-10"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Video size={20} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-base tracking-tight">Meeting Room</p>
                        <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs font-mono text-zinc-500">#{roomName}</p>
                            <AnimatePresence>
                                {connectionState === 'connected' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                                    >
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                                    </motion.div>
                                )}
                                {connectionState === 'connecting' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20"
                                    >
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Connecting</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                        <Shield size={12} className="text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Encrypted</span>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl text-xs font-bold transition-all border border-red-500/10 hover:border-red-500/20"
                    >
                        <ArrowLeft size={14} /> Keluar
                    </button>
                </div>
            </motion.div>

            {/* LiveKit Interface */}
            <main className="flex-1 relative">
                <LiveKitRoom
                    video={true}
                    audio={true}
                    token={token}
                    serverUrl={LIVEKIT_SERVER_URL}
                    onConnected={() => {
                        setHasConnected(true);
                        setConnectionState('connected');
                    }}
                    onDisconnected={() => {
                        setConnectionState('disconnected');
                        if (hasConnected) {
                            router.back();
                        } else {
                            setError("Koneksi ke LiveKit server gagal. Pastikan server aktif.");
                        }
                    }}
                    onError={(err: any) => {
                        console.error("[Meeting] LiveKit Error:", err);
                        if (!hasConnected) setError(`Koneksi gagal: ${err.message}`);
                    }}
                    className="h-full"
                >
                    <VideoConference />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </main>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none z-[5]" />
        </div>
    );
}
