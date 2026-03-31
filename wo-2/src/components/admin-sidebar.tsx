"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Ticket,
    FileText,
    PieChart,
    Image as ImageIcon,
    ChevronLeft,
    LogOut,
    Shield,
    Palette,
    Code,
    Headphones,
    User,
    ExternalLink,
    MessageCircle,
    Smartphone,
    Archive,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
    userName: string;
    role: string; // 'head_it' | 'designer' | 'it_dev' | 'it_support'
}

const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
    head_it: { label: "Head of IT", icon: Shield, color: "text-violet-500" },
    designer: { label: "Designer", icon: Palette, color: "text-pink-500" },
    it_dev: { label: "IT Developer", icon: Code, color: "text-blue-500" },
    it_support: { label: "IT Support", icon: Headphones, color: "text-green-500" },
};

export function AdminSidebar({ userName, role }: AdminSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const config = roleConfig[role] || roleConfig.designer;
    const RoleIcon = config.icon;

    const menuItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/tickets", label: "Kelola Tiket", icon: Ticket },
        { href: "/admin/it-dev", label: "IT Development", icon: Code },
        { href: "/admin/reports", label: "Laporan Tim", icon: FileText },
        { href: "/admin/reporting", label: "Reporting", icon: PieChart },
        { href: "/admin/showcase", label: "Showcase", icon: ImageIcon },
        { href: "/admin/app-showcase", label: "App Showcase", icon: Smartphone },
        { href: "/admin/archive", label: "Arsip Tiket", icon: Archive },
        { href: "/admin/chat", label: "Team Chat", icon: MessageCircle },
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
                    <div className="flex items-center">
                        <Image src="/logo.png" alt="Digital Technology" width={170} height={42} className="h-9 w-auto object-contain" />
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
                    <div className={`p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${config.color}`}>
                        <RoleIcon size={16} />
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Role
                            </p>
                            <p className="text-xs font-bold">{config.label}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href));

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
                            <p className="text-[10px] text-muted-foreground">{config.label}</p>
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
