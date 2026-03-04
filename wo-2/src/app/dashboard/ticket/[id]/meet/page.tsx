"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function MeetingRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const [token, setToken] = useState("");
    const [ticket, setTicket] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        async function initializeMeeting() {
            try {
                // 1. Get user identity
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const username = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
                const userId = user.id;

                // 2. Verify ticket
                const { data: woData, error: woError } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (woError || !woData) throw new Error("Tiket tidak ditemukan.");

                // Add basic check if meeting is supposed to be online
                if (woData.meeting_type !== 'Online') {
                    throw new Error("Tiket ini tidak dijadwalkan untuk Online Meeting.");
                }

                setTicket(woData);

                // 3. Request LiveKit Token
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

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-white">
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-2xl max-w-md text-center">
                    <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-6 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={16} /> Kembali
                    </button>
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
                    <p className="text-zinc-400 text-xs">Internal Video Conference • {ticket?.brand}</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors"
                >
                    <ArrowLeft size={16} /> Keluar Ruangan
                </button>
            </div>

            <div className="flex-1 relative">
                {!process.env.NEXT_PUBLIC_LIVEKIT_URL ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-red-500">
                        <AlertCircle size={48} className="mb-4" />
                        <h2 className="text-xl font-bold">Error: Server URL is missing</h2>
                        <p className="max-w-md text-center text-sm mt-2 opacity-80">NEXT_PUBLIC_LIVEKIT_URL environment variable is not defined on the client. Please check your .env configuration and rebuild the app.</p>
                    </div>
                ) : (
                    <LiveKitRoom
                        video={true}
                        audio={true}
                        token={token}
                        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                        onDisconnected={() => {
                            console.log("Disconnected from room.");
                            alert("Anda telah terputus atau keluar dari ruangan (Disconnected).");
                            router.back();
                        }}
                        className="h-full w-full custom-lk-theme"
                    >
                        <VideoConference />
                        <RoomAudioRenderer />
                    </LiveKitRoom>
                )}
            </div>
        </div>
    );
}
