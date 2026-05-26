"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userName, setUserName] = useState<string>("User");
    const [loading, setLoading] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");
            setLoading(false);
        }
        checkUser();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold animate-pulse">Loading Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Mobile backdrop */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Mobile hamburger button */}
            <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-border shadow-md"
                aria-label="Toggle sidebar"
            >
                {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Sidebar
                userName={userName}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
            <main className="transition-all duration-300 lg:pl-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
