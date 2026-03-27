"use client";

import { useState, useMemo } from "react";
import {
    useLocalParticipant,
    useParticipants,
    useTracks,
    useTrackToggle,
    useRoomContext,
    VideoTrack,
    AudioTrack,
    TrackLoop,
    ParticipantName,
    ConnectionQualityIndicator,
    RoomAudioRenderer,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import type { ToggleSource } from "@livekit/components-core";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    MonitorOff,
    PhoneOff,
    Users,
    Maximize2,
    Minimize2,
    MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function TrackToggleButton({
    source,
    enabledIcon,
    disabledIcon,
    label,
    activeClass = "bg-zinc-700 hover:bg-zinc-600",
    inactiveClass = "bg-red-500/80 hover:bg-red-500",
}: {
    source: ToggleSource;
    enabledIcon: React.ReactNode;
    disabledIcon: React.ReactNode;
    label: string;
    activeClass?: string;
    inactiveClass?: string;
}) {
    const { buttonProps, enabled } = useTrackToggle({ source });

    return (
        <button
            {...buttonProps}
            className={`relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                enabled ? activeClass : inactiveClass
            }`}
            title={label}
        >
            {enabled ? enabledIcon : disabledIcon}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-medium text-zinc-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {enabled ? label : `${label} Off`}
            </span>
        </button>
    );
}

function ScreenShareToggleButton() {
    const { buttonProps, enabled } = useTrackToggle({
        source: Track.Source.ScreenShare,
    });

    return (
        <button
            {...buttonProps}
            className={`relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                enabled
                    ? "bg-primary/80 hover:bg-primary ring-2 ring-primary/30"
                    : "bg-zinc-700 hover:bg-zinc-600"
            }`}
            title="Share Screen"
        >
            {enabled ? (
                <MonitorOff size={20} className="text-white" />
            ) : (
                <MonitorUp size={20} className="text-white" />
            )}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-medium text-zinc-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {enabled ? "Stop Share" : "Share Screen"}
            </span>
        </button>
    );
}

function ParticipantTile({
    trackRef,
    isFocused,
    onFocus,
}: {
    trackRef: any;
    isFocused: boolean;
    onFocus: () => void;
}) {
    const isScreenShare = trackRef.source === Track.Source.ScreenShare;
    const participantName =
        trackRef.participant?.name ||
        trackRef.participant?.identity ||
        "Participant";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={onFocus}
            className={`relative rounded-2xl overflow-hidden bg-zinc-800/50 border border-white/5 cursor-pointer group transition-all hover:border-white/10 ${
                isFocused ? "col-span-full row-span-2" : ""
            }`}
        >
            {trackRef.publication?.track ? (
                <VideoTrack
                    trackRef={trackRef}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                            {participantName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            )}

            {/* Overlay info */}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isScreenShare && (
                            <span className="px-2 py-0.5 bg-primary/80 rounded-md text-[10px] font-bold text-white uppercase">
                                Screen
                            </span>
                        )}
                        <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                            {participantName}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFocus();
                        }}
                        className="p-1.5 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                    >
                        {isFocused ? (
                            <Minimize2 size={12} className="text-white" />
                        ) : (
                            <Maximize2 size={12} className="text-white" />
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function CustomVideoConference({
    onLeave,
}: {
    onLeave?: () => void;
}) {
    const room = useRoomContext();
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const [focusedTrackSid, setFocusedTrackSid] = useState<string | null>(null);

    // Get all video + screen share tracks
    const cameraTracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    const screenShareTracks = cameraTracks.filter(
        (t) => t.source === Track.Source.ScreenShare
    );

    // Auto-focus screen share when someone starts sharing
    const effectiveFocus = useMemo(() => {
        if (screenShareTracks.length > 0 && !focusedTrackSid) {
            return screenShareTracks[0].publication?.trackSid || null;
        }
        return focusedTrackSid;
    }, [screenShareTracks, focusedTrackSid]);

    const focusedTrack = cameraTracks.find(
        (t) => t.publication?.trackSid === effectiveFocus
    );
    const otherTracks = cameraTracks.filter(
        (t) => t.publication?.trackSid !== effectiveFocus
    );

    const handleLeave = () => {
        room.disconnect();
        onLeave?.();
    };

    return (
        <div className="flex flex-col h-full w-full bg-zinc-950">
            {/* Video Grid */}
            <div className="flex-1 p-3 overflow-hidden">
                {focusedTrack ? (
                    // Focus + sidebar layout
                    <div className="h-full flex gap-3">
                        {/* Main focused video */}
                        <div className="flex-1 min-w-0">
                            <ParticipantTile
                                trackRef={focusedTrack}
                                isFocused={false}
                                onFocus={() => setFocusedTrackSid(null)}
                            />
                        </div>
                        {/* Sidebar with other participants */}
                        {otherTracks.length > 0 && (
                            <div className="w-48 lg:w-56 flex flex-col gap-3 overflow-y-auto">
                                {otherTracks.map((trackRef) => (
                                    <div
                                        key={
                                            trackRef.publication?.trackSid ||
                                            `${trackRef.participant.identity}-${trackRef.source}`
                                        }
                                        className="aspect-video shrink-0"
                                    >
                                        <ParticipantTile
                                            trackRef={trackRef}
                                            isFocused={false}
                                            onFocus={() =>
                                                setFocusedTrackSid(
                                                    trackRef.publication?.trackSid || null
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Grid layout
                    <div
                        className={`h-full grid gap-3 ${
                            cameraTracks.length === 1
                                ? "grid-cols-1"
                                : cameraTracks.length === 2
                                ? "grid-cols-2"
                                : cameraTracks.length <= 4
                                ? "grid-cols-2 grid-rows-2"
                                : cameraTracks.length <= 6
                                ? "grid-cols-3 grid-rows-2"
                                : "grid-cols-3 grid-rows-3"
                        }`}
                    >
                        <AnimatePresence>
                            {cameraTracks.map((trackRef) => (
                                <ParticipantTile
                                    key={
                                        trackRef.publication?.trackSid ||
                                        `${trackRef.participant.identity}-${trackRef.source}`
                                    }
                                    trackRef={trackRef}
                                    isFocused={false}
                                    onFocus={() =>
                                        setFocusedTrackSid(
                                            trackRef.publication?.trackSid || null
                                        )
                                    }
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Custom Control Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-20 px-6 py-4 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5"
            >
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    {/* Left: Participant count */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <Users size={14} className="text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-400">
                            {participants.length}
                        </span>
                    </div>

                    {/* Center: Controls */}
                    <div className="flex items-center gap-3">
                        <TrackToggleButton
                            source={Track.Source.Microphone}
                            enabledIcon={<Mic size={20} className="text-white" />}
                            disabledIcon={<MicOff size={20} className="text-white" />}
                            label="Mic"
                        />

                        <TrackToggleButton
                            source={Track.Source.Camera}
                            enabledIcon={<Video size={20} className="text-white" />}
                            disabledIcon={<VideoOff size={20} className="text-white" />}
                            label="Camera"
                        />

                        <ScreenShareToggleButton />

                        {/* Leave button */}
                        <button
                            onClick={handleLeave}
                            className="relative group flex items-center gap-2 px-5 h-12 bg-red-500 hover:bg-red-600 rounded-2xl transition-all duration-200"
                            title="Leave Meeting"
                        >
                            <PhoneOff size={20} className="text-white" />
                            <span className="text-sm font-bold text-white hidden sm:inline">
                                Keluar
                            </span>
                        </button>
                    </div>

                    {/* Right: spacer for symmetry */}
                    <div className="w-[72px]" />
                </div>
            </motion.div>

            <RoomAudioRenderer />
        </div>
    );
}
