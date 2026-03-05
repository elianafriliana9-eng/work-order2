"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

// LiveKit server URL - resolved at build time from env, with runtime fallback
const LIVEKIT_SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://203.194.114.155:7880';

export default function MeetingRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const [token, setToken] = useState("");
    const [ticket, setTicket] = useState<any>(null);
    const [error, setError] = useState("");
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [hasEverConnected, setHasEverConnected] = useState(false);

    useEffect(() => {
        if (!id) return;

        async function initializeMeeting() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const username = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
                const userId = user.id;

                const { data: woData, error: woError } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (woError || !woData) throw new Error("Tiket tidak ditemukan.");

                if (woData.meeting_type !== 'Online') {
                    throw new Error("Tiket ini tidak dijadwalkan untuk Online Meeting.");
                }

                setTicket(woData);

                const roomName = `ticket-${id}`;
                const res = await fetch(`/api/livekit?room=${roomName}&username=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Gagal mendapatkan akses ruangan.");

                setToken(data.token);

            } catch (err: any) {
                setError(err.message);
            }
        }

        initializeMeeting();
    }, [id, router]);

    const handleDisconnected = useCallback(() => {
        console.log("[Meeting] Disconnected from room. hasEverConnected:", hasEverConnected);
        setConnectionState('disconnected');
        // Only auto-navigate if user had successfully connected before
        // If never connected, it means connection failed - show error instead
        if (hasEverConnected) {
            router.back();
        } else {
            setError("Koneksi ke server meeting gagal. Pastikan LiveKit server berjalan dan bisa diakses.");
        }
    }, [hasEverConnected, router]);

    const handleConnected = useCallback(() => {
        console.log("[Meeting] Successfully connected to room!");
        setConnectionState('connected');
        setHasEverConnected(true);
    }, []);

    const handleRetry = () => {
        setError("");
        setToken("");
        setConnectionState('connecting');
        setHasEverConnected(false);
        // Re-trigger the effect
        window.location.reload();
    };

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-white">
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-2xl max-w-md text-center">
                    <AlertCircle size={48} className="mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
                    <p className="text-sm">{error}</p>
                    <div className="flex gap-3 mt-6 justify-center">
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={16} /> Coba Lagi
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft size={16} /> Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p>Menyiapkan Ruangan Meeting...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden">
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between z-10">
                <div>
                    <h1 className="text-white font-bold text-lg">{ticket?.title || "Meeting Room"}</h1>
                    <p className="text-zinc-400 text-xs">
                        Internal Video Conference • {ticket?.brand}
                        {connectionState === 'connecting' && ' • Menghubungkan...'}
                        {connectionState === 'connected' && ' • 🟢 Terhubung'}
                    </p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors"
                >
                    <ArrowLeft size={16} /> Keluar Ruangan
                </button>
            </div>

            <div className="flex-1 relative">
                <LiveKitRoom
                    video={true}
                    audio={true}
                    token={token}
                    serverUrl={LIVEKIT_SERVER_URL}
                    onConnected={handleConnected}
                    onDisconnected={handleDisconnected}
                    onError={(err) => {
                        console.error("[Meeting] LiveKit Error:", err);
                        if (!hasEverConnected) {
                            setError(`Koneksi gagal: ${err.message}. Pastikan LiveKit server di VPS aktif.`);
                        }
                    }}
                    className="h-full w-full custom-lk-theme"
                >
                    <VideoConference />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </div>
        </div>
    );
}
