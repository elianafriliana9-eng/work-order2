"use client";

import React, { useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  User,
  ShieldCheck,
  History,
  QrCode,
  ArrowRightLeft,
  Info,
} from "lucide-react";
import { Asset, AuditTrailEntry, UserRolePermission } from "@/types/asset";
import { getAuditTrailByAssetId } from "@/lib/mock-assets";

interface AssetDetailDrawerProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (asset: Asset) => void;
  onHandover?: (asset: Asset) => void;
  onOpenQrSignature?: (asset: Asset) => void;
  userRole: UserRolePermission;
}

export function AssetDetailDrawer({
  asset,
  isOpen,
  onClose,
  onEdit,
  onHandover,
  onOpenQrSignature,
  userRole,
}: AssetDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const auditTrail: AuditTrailEntry[] = getAuditTrailByAssetId(asset.id);
  const canManage = userRole === "head_it" || userRole === "it_support";

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-detail-title"
    >
      {/* Backdrop click area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content */}
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                {asset.assetTag}
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {asset.category}
              </span>
            </div>
            <h2
              id="asset-detail-title"
              className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1"
            >
              {asset.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Tutup detail aset"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                <ShieldCheck size={14} className="text-blue-500" />
                Status Aset
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {asset.status}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Kondisi: <span className="font-medium">{asset.condition}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                <User size={14} className="text-emerald-500" />
                PIC Penanggung Jawab
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {asset.currentPic}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {asset.currentPicRole}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                <MapPin size={14} className="text-amber-500" />
                Lokasi Saat Ini
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {asset.location}
              </div>
              <div className="text-[11px] text-muted-foreground">Kantor Operasional</div>
            </div>
          </div>

          {/* Specifications & Identification */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow-xs">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info size={14} />
              Spesifikasi & Identifikasi Perangkat
            </h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Nomor Seri (Serial Number)</dt>
                <dd className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {asset.serialNumber}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Merk & Model</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {asset.brandModel}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Spesifikasi Lengkap</dt>
                <dd className="text-zinc-800 dark:text-zinc-200 mt-0.5 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800 leading-relaxed font-mono text-[11px]">
                  {asset.specs}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Tanggal Perolehan</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                  <Calendar size={13} className="text-muted-foreground" />
                  {asset.acquisitionDate}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Masa Garansi Vendor</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                  <Calendar size={13} className="text-muted-foreground" />
                  Hingga {asset.warrantyExpiry}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Nilai Perolehan Aset</dt>
                <dd className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatRupiah(asset.acquisitionValue)}
                </dd>
              </div>

              <div>
                <dt className="text-muted-foreground">Email PIC</dt>
                <dd className="text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                  {asset.currentPicEmail}
                </dd>
              </div>

              {asset.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Catatan Tambahan</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300 mt-0.5 italic">
                    &ldquo;{asset.notes}&rdquo;
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Timeline & Audit Trail */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow-xs">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={14} />
              Audit Trail & Histori Serah Terima
            </h3>

            {auditTrail.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">
                Belum ada catatan histori perpindahan aset.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="relative group">
                    {/* Circle Node */}
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-100 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {entry.description}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {new Date(entry.timestamp).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          Oleh: <strong className="text-foreground">{entry.actor}</strong> ({entry.actorRole})
                        </span>
                        {entry.documentNumber && (
                          <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                            Doc: {entry.documentNumber}
                          </span>
                        )}
                      </div>

                      {entry.fromPic && entry.toPic && (
                        <div className="mt-2 text-xs bg-white dark:bg-zinc-900/60 p-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {entry.fromPic}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {entry.toPic}
                          </span>
                        </div>
                      )}

                      {entry.notes && (
                        <p className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                          Catatan: {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onOpenQrSignature && (
              <button
                onClick={() => onOpenQrSignature(asset)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
              >
                <QrCode size={15} />
                Tanda Tangan QR
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canManage && onHandover && (
              <button
                onClick={() => onHandover(asset)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <ArrowRightLeft size={14} />
                Transfer / Handover
              </button>
            )}
            {canManage && onEdit && (
              <button
                onClick={() => onEdit(asset)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Edit Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
