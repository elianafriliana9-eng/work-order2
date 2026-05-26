"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Ticket,
    PlusCircle,
    Settings,
    LogOut,
    User,
    ChevronLeft,
    ChevronRight,
    Home
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function Sidebar({ userName, isMobileOpen, onCloseMobile }: { userName: string; isMobileOpen?: boolean; onCloseMobile?: () => void }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const router = useRouter();

    const menuItems = [
        { icon: Home, label: "Home", href: "/dashboard" },
        { icon: Ticket, label: "My Tickets", href: "/dashboard" }, // In actual app, might be different
        { icon: PlusCircle, label: "New Order", href: "/new-ticket" },
        { icon: Settings, label: "Settings", href: "#" },
    ];

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/");
    }

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white dark:bg-zinc-900 border-r border-border transition-all duration-300 z-50 flex flex-col ${isCollapsed ? "w-20" : "w-64"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <Link href="/dashboard" className="flex items-center overflow-hidden">
                        <Image src="/logo.png" alt="Digital Technology" width={220} height={55} className="h-12 w-auto object-contain" />
                    </Link>
                )}
                {isCollapsed && (
                    <Link href="/dashboard" className="mx-auto">
                        <Image src="/logo.png" alt="Digital Technology" width={48} height={48} className="h-12 w-12 object-contain" />
                    </Link>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:block absolute -right-3 top-12 bg-white dark:bg-zinc-800 border border-border p-1 rounded-full shadow-md text-muted-foreground hover:text-primary transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-6 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={onCloseMobile}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground"
                                }`}
                        >
                            <item.icon size={20} />
                            {!isCollapsed && <span className="font-semibold text-sm">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-border">
                {!isCollapsed ? (
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold truncate">{userName}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">User Access</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut size={14} /> Keluar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="mx-auto flex items-center justify-center p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                )}
            </div>
        </aside>
    );
}
