"use client";

import { useEffect, useState } from "react";
import { TeamSidebar } from "@/components/team-sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TeamDesignLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userName, setUserName] = useState<string>("Designer");
    const [role, setRole] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function checkAccess() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    if (isMounted) router.push("/login");
                    return;
                }

                if (isMounted) {
                    setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Designer");
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!isMounted) return;

                if (profileError || !profile || profile.role !== 'designer') {
                    router.push("/dashboard");
                    return;
                }

                setRole(profile.role);
                setLoading(false);
            } catch (err) {
                console.error("Team layout auth check failed:", err);
                if (isMounted) router.push("/login");
            }
        }

        checkAccess();
        return () => { isMounted = false };
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold animate-pulse">Loading Design Panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <TeamSidebar userName={userName} role={role} />
            <main className="transition-all duration-300 lg:pl-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
