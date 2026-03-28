"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Ticket,
    Send,
    ChevronLeft,
    LogOut,
    Palette,
    User,
    ExternalLink,
    ListOrdered,
    MessageCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface TeamSidebarProps {
    userName: string;
    role: string;
}

export function TeamSidebar({ userName, role }: TeamSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        { href: "/team/design", label: "Dashboard", icon: LayoutDashboard },
        { href: "/team/design/queue", label: "Antrian Tiket", icon: ListOrdered },
        { href: "/team/design/report", label: "Laporan Harian", icon: Send },
        { href: "/team/design/chat", label: "Team Chat", icon: MessageCircle },
    ];

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/");
    }

    return (
        <aside
            className={`fixed top-0 left-0 z-40 h-screen border-r border-border bg-white dark:bg-zinc-950 transition-all duration-300 flex flex-col ${collapsed ? "w-[70px]" : "w-64"
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="bg-pink-500 text-white p-1.5 rounded-lg">
                            <Palette size={18} />
                        </div>
                        <span className="font-bold text-sm">Design Team</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <ChevronLeft
                        size={18}
                        className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
                    />
                </button>
            </div>

            {/* Role Badge */}
            <div className={`px-4 py-3 border-b border-border ${collapsed ? "px-2" : ""}`}>
                <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
                    <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-500">
                        <Palette size={16} />
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Role
                            </p>
                            <p className="text-xs font-bold">Designer</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/team/design" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                                : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground"
                                } ${collapsed ? "justify-center px-2" : ""}`}
                        >
                            <item.icon size={18} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-3 border-t border-border space-y-1">
                {!collapsed && (
                    <div className="flex items-center gap-2 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                            <User size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{userName}</p>
                            <p className="text-[10px] text-muted-foreground">Designer</p>
                        </div>
                    </div>
                )}
                <Link
                    href="/"
                    target="_blank"
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors ${collapsed ? "justify-center px-2" : ""
                        }`}
                >
                    <ExternalLink size={18} />
                    {!collapsed && <span>Lihat Landing Page</span>}
                </Link>
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${collapsed ? "justify-center px-2" : ""
                        }`}
                >
                    <LogOut size={18} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
