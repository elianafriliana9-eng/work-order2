"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  Laptop,
  QrCode,
  ExternalLink,
  Eye,
  Calendar,
  MapPin,
  FileSignature,
} from "lucide-react";
import { Asset, HandoverRecord } from "@/types/asset";
import {
  getStoredAssets,
  getStoredHandovers,
} from "@/lib/mock-assets";
import { AssetDetailDrawer } from "@/components/assets/AssetDetailDrawer";

export default function UserAssetDashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Active user name in demo/mock: Budi Santoso / Hendra Wijaya
  const currentUserName = "Budi Santoso";

  useEffect(() => {
    const timer = setTimeout(() => {
      const allAssets = getStoredAssets();
      const allHandovers = getStoredHandovers();
      setAssets(allAssets);
      setHandovers(allHandovers);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter assets assigned to current user
  const myAssets = assets.filter(
    (a) => a.currentPic.toLowerCase() === currentUserName.toLowerCase()
  );

  // Pending sign requests for current user (or any pending in demo)
  const pendingHandovers = handovers.filter(
    (h) => h.status === "pending_signatures"
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              Inventaris Karyawan
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              PIC: {currentUserName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Boxes className="text-primary" size={28} />
            Aset & Berita Acara Saya
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar perangkat inventaris perusahaan yang diamanahkan kepada Anda dan permintaan tanda tangan BAST.
          </p>
        </div>

        <Link
          href="/admin/assets"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Lihat Mode Admin IT <ExternalLink size={13} />
        </Link>
      </div>

      {/* Pending Signatures Alert Card */}
      {pendingHandovers.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200 dark:border-purple-800/80 space-y-3">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <QrCode size={20} />
            <h2 className="text-sm font-bold">
              Menunggu Tanda Tangan Digital BAST ({pendingHandovers.length})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Terdapat Berita Acara Serah Terima aktif yang memerlukan persetujuan digital Anda. Silakan buka tautan penandatanganan di bawah ini:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingHandovers.map((h) => {
              const pendingSigner =
                h.signers.find((s) => s.status === "pending") || h.signers[1];
              return (
                <div
                  key={h.id}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {h.documentNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                        {h.documentVersion}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1">
                      {h.assetTag} - {h.assetName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Signer: {pendingSigner?.name} ({pendingSigner?.role})
                    </div>
                  </div>

                  <Link
                    href={`/assets/sign/${pendingSigner?.token || "tok-valid-penerima"}`}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
                  >
                    <FileSignature size={14} />
                    Tanda Tangani
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Assets Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-xs">
          Perangkat Yang Sedang Anda Gunakan ({myAssets.length})
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-3"
              >
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded" />
              </div>
            ))}
          </div>
        ) : myAssets.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-2">
            <Laptop size={32} className="mx-auto text-muted-foreground" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Belum Ada Aset Terdaftar Atas Nama Anda
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Hubungi tim IT jika Anda telah menerima perangkat namun belum tercatat pada Berita Acara Serah Terima.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {asset.assetTag}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {asset.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {asset.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {asset.brandModel}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 line-clamp-2">
                    {asset.specs}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span className="truncate">{asset.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>Garansi hingga {asset.warrantyExpiry}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Kondisi: <strong className="text-foreground">{asset.condition}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedAsset(asset);
                      setIsDetailOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <Eye size={13} />
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AssetDetailDrawer
        asset={selectedAsset}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        userRole="employee"
      />
    </div>
  );
}
