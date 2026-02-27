"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userName, setUserName] = useState<string>("Admin");
    const [role, setRole] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkAdminAccess() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin");

            // Fetch profile to get role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || !['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)) {
                // Not an admin role, redirect to user dashboard
                router.push("/dashboard");
                return;
            }

            setRole(profile.role);
            setLoading(false);
        }
        checkAdminAccess();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold animate-pulse">Loading Admin Panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <AdminSidebar userName={userName} role={role} />
            <main className="transition-all duration-300 lg:pl-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
