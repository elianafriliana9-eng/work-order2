"use client";

import React from "react";
import {
  Boxes,
  CheckCircle2,
  Wrench,
  Archive,
  QrCode,
} from "lucide-react";
import { motion } from "framer-motion";
import { AssetMetrics as MetricsType } from "@/types/asset";

interface AssetMetricsProps {
  metrics: MetricsType;
  isLoading?: boolean;
}

export function AssetMetrics({ metrics, isLoading = false }: AssetMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-12 h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="w-16 h-7 rounded bg-zinc-200 dark:bg-zinc-800 mb-2" />
            <div className="w-24 h-3 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Aset",
      value: metrics.total,
      subtext: "Semua inventaris",
      icon: Boxes,
      color: "text-zinc-900 dark:text-zinc-100",
      bg: "bg-zinc-100 dark:bg-zinc-800",
      badge: "Terdaftar",
    },
    {
      label: "Aset Aktif",
      value: metrics.active,
      subtext: "Digunakan PIC",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      badge: `${metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% total`,
    },
    {
      label: "Dalam Perbaikan",
      value: metrics.inRepair,
      subtext: "Maintenance / Servis",
      icon: Wrench,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      badge: "Perlu Pantau",
    },
    {
      label: "Tersedia & Afkir",
      value: metrics.retiredOrAvailable,
      subtext: "Pool spare / Non-aktif",
      icon: Archive,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      badge: "Ready / Scrap",
    },
    {
      label: "Pending BAST",
      value: metrics.pendingSignature,
      subtext: "Menunggu TTD QR",
      icon: QrCode,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      badge: "Action Diperlukan",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.25 }}
            className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 sm:p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                <Icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {card.badge}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {card.value}
            </div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
              {card.label}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {card.subtext}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
