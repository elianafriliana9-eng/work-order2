"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChatBox } from "@/components/chat-box";
import { MessageCircle } from "lucide-react";

export default function AdminChatPage() {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "PIC IT");
      }
      setLoading(false);
    }
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-white dark:bg-zinc-950 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <MessageCircle size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Team Chat</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              PIC IT &harr; Designer
            </p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatBox
          currentUserId={userId}
          currentUserName={userName}
          currentUserRole="head_it"
        />
      </div>
    </div>
  );
}
