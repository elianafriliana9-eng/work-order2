"use client";

import React, { useState, useMemo } from "react";
import {
  Eye,
  Edit2,
  ArrowRightLeft,
  QrCode,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Monitor,
  Server,
  Network,
  Smartphone,
  HardDrive,
  Package,
} from "lucide-react";
import { Asset, UserRolePermission } from "@/types/asset";

interface AssetTableProps {
  assets: Asset[];
  isLoading?: boolean;
  onViewDetail: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onHandover: (asset: Asset) => void;
  onOpenQrSignature: (asset: Asset) => void;
  onRetire: (asset: Asset) => void;
  userRole: UserRolePermission;
  onResetFilters?: () => void;
}

type SortField = "assetTag" | "name" | "category" | "acquisitionDate" | "status";
type SortOrder = "asc" | "desc";

export function AssetTable({
  assets,
  isLoading = false,
  onViewDetail,
  onEdit,
  onHandover,
  onOpenQrSignature,
  onRetire,
  userRole,
  onResetFilters,
}: AssetTableProps) {
  const [sortField, setSortField] = useState<SortField>("assetTag");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const canManage = userRole === "head_it" || userRole === "it_support";

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      const valA: string | number = a[sortField] || "";
      const valB: string | number = b[sortField] || "";

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB as string)
          : (valB as string).localeCompare(valA);
      }
      return sortOrder === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [assets, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedAssets.length / pageSize));
  const paginatedAssets = sortedAssets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Laptop":
        return <Laptop size={16} className="text-blue-500 shrink-0" />;
      case "Desktop":
        return <HardDrive size={16} className="text-indigo-500 shrink-0" />;
      case "Monitor":
        return <Monitor size={16} className="text-violet-500 shrink-0" />;
      case "Server":
        return <Server size={16} className="text-emerald-500 shrink-0" />;
      case "Networking":
        return <Network size={16} className="text-amber-500 shrink-0" />;
      case "Mobile Device":
        return <Smartphone size={16} className="text-pink-500 shrink-0" />;
      default:
        return <Package size={16} className="text-zinc-500 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aktif":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
          </span>
        );
      case "Dalam Perbaikan":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Perbaikan
          </span>
        );
      case "Tersedia":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Tersedia
          </span>
        );
      case "Afkir":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Afkir
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "Baik":
        return (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Baik
          </span>
        );
      case "Rusak Ringan":
        return (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Rusak Ringan
          </span>
        );
      case "Dalam Perbaikan":
        return (
          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            Dalam Perbaikan
          </span>
        );
      case "Rusak Berat":
        return (
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            Rusak Berat
          </span>
        );
      default:
        return <span className="text-xs text-zinc-500">{condition}</span>;
    }
  };

  // 1. SKELETON STATE
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded hidden md:block" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. EMPTY STATE
  if (assets.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mx-auto flex items-center justify-center mb-4">
          <Package size={32} />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Tidak Ada Data Aset Ditemukan
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
          Data aset dengan kriteria pencarian atau filter yang Anda pilih tidak tersedia di database.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Reset Semua Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Table container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th
                onClick={() => handleSort("assetTag")}
                className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  Tag AST
                  {sortField === "assetTag" &&
                    (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </div>
              </th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  Nama & Spesifikasi Aset
                  {sortField === "name" &&
                    (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </div>
              </th>
              <th
                onClick={() => handleSort("category")}
                className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors hidden sm:table-cell"
              >
                <div className="flex items-center gap-1">
                  Kategori
                  {sortField === "category" &&
                    (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </div>
              </th>
              <th className="py-3 px-4 hidden md:table-cell">PIC / Penanggung Jawab</th>
              <th className="py-3 px-4 hidden lg:table-cell">Lokasi</th>
              <th
                onClick={() => handleSort("status")}
                className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === "status" &&
                    (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-sm">
            {paginatedAssets.map((asset) => {
              const hasActiveHandover = Boolean(asset.activeHandoverId);

              return (
                <tr
                  key={asset.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  {/* Tag AST */}
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{asset.assetTag}</span>
                      {hasActiveHandover && (
                        <span
                          title="Ada proses serah terima aktif yang menunggu tanda tangan"
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        >
                          BAST Pending
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-muted-foreground font-sans">
                      SN: {asset.serialNumber}
                    </div>
                  </td>

                  {/* Name & Model */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {asset.name}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {asset.brandModel}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {getCategoryIcon(asset.category)}
                      {asset.category}
                    </div>
                  </td>

                  {/* Current PIC */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100">
                      {asset.currentPic}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                      {asset.currentPicRole}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                    <span className="line-clamp-1" title={asset.location}>
                      {asset.location}
                    </span>
                  </td>

                  {/* Status & Condition */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {getStatusBadge(asset.status)}
                      <span className="text-[10px] text-muted-foreground">
                        Kondisi: {getConditionBadge(asset.condition)}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {/* Detail View (always enabled) */}
                      <button
                        onClick={() => onViewDetail(asset)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Lihat Detail & Histori Aset"
                        aria-label={`Lihat detail ${asset.assetTag}`}
                      >
                        <Eye size={16} />
                      </button>

                      {/* QR Signature View (if active handover or can manage) */}
                      <button
                        onClick={() => onOpenQrSignature(asset)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          hasActiveHandover
                            ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                        title={
                          hasActiveHandover
                            ? "Lihat QR & Status Tanda Tangan BAST"
                            : "Lihat QR Verifikasi Dokumen"
                        }
                        aria-label={`QR Tanda Tangan ${asset.assetTag}`}
                      >
                        <QrCode size={16} />
                      </button>

                      {/* Handover Button (Permission controlled) */}
                      {canManage ? (
                        <button
                          onClick={() => onHandover(asset)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Serah Terima (Transfer) ke PIC Baru"
                          aria-label={`Serah terima ${asset.assetTag}`}
                        >
                          <ArrowRightLeft size={16} />
                        </button>
                      ) : (
                        <span
                          className="p-1.5 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                          title="Akses terbatas: Hanya Admin IT yang dapat melakukan transfer"
                        >
                          <ArrowRightLeft size={16} />
                        </span>
                      )}

                      {/* Edit Button (Permission controlled) */}
                      {canManage ? (
                        <button
                          onClick={() => onEdit(asset)}
                          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Edit Data Aset"
                          aria-label={`Edit ${asset.assetTag}`}
                        >
                          <Edit2 size={16} />
                        </button>
                      ) : (
                        <span
                          className="p-1.5 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                          title="Akses terbatas: Edit hanya untuk Admin IT"
                        >
                          <Edit2 size={16} />
                        </span>
                      )}

                      {/* Retire / Afkir (Admin only) */}
                      {userRole === "head_it" && asset.status !== "Afkir" && (
                        <button
                          onClick={() => onRetire(asset)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Afkirkan Aset"
                          aria-label={`Afkirkan ${asset.assetTag}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer */}
      <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          Menampilkan baris{" "}
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {(currentPage - 1) * pageSize + 1}
          </span>{" "}
          -{" "}
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {Math.min(currentPage * pageSize, sortedAssets.length)}
          </span>{" "}
          dari{" "}
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {sortedAssets.length}
          </span>{" "}
          aset
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 font-medium text-zinc-800 dark:text-zinc-200">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Halaman berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
