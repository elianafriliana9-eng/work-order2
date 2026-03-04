"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    LiveKitRoom, 
    VideoConference, 
    GridLayout, 
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    useTracks
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MeetingPage() {
    const { id: roomName } = useParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function prepareMeeting() {
            try {
                // 1. Get user data
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
                setUserName(name);

                // 2. Fetch LiveKit token from our API
                const resp = await fetch(`/api/livekit/token?room=${roomName}&username=${name}`);
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

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center">
                    <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Waduh, Gagal Connect!</h2>
                    <p className="text-sm text-zinc-400 mb-6">{error}</p>
                    <button 
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 gap-4 text-white">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-sm font-bold animate-pulse uppercase tracking-[0.2em]">Menyiapkan Ruang Meeting...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Simple Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold"
                >
                    <ArrowLeft size={18} /> Keluar Ruangan
                </button>
                <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Meeting ID</p>
                    <p className="text-xs font-mono text-zinc-300">#{roomName}</p>
                </div>
            </div>

            {/* LiveKit Interface */}
            <main className="flex-1 relative">
                <LiveKitRoom
                    video={true}
                    audio={true}
                    token={token}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                    onDisconnected={() => router.back()}
                    className="h-full"
                >
                    {/* The specialized LiveKit component for a full conference UI */}
                    <VideoConference />
                    
                    {/* Audio renderer is required for audio playback */}
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </main>
        </div>
    );
}
