"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Asset,
  AssetMetrics as MetricsType,
  UserRolePermission,
} from "@/types/asset";
import {
  getStoredAssets,
  getAssetMetrics,
  createAsset,
  updateAsset,
  deleteOrRetireAsset,
  createHandover,
  resetAllAssetData,
} from "@/lib/mock-assets";
import { AssetFormValues, HandoverFormValues } from "@/lib/asset-schemas";
import { AssetMetrics } from "@/components/assets/AssetMetrics";
import { AssetFilters, FilterState } from "@/components/assets/AssetFilters";
import { AssetTable } from "@/components/assets/AssetTable";
import { AssetDetailDrawer } from "@/components/assets/AssetDetailDrawer";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { AssetHandoverModal } from "@/components/assets/AssetHandoverModal";
import { AssetQrSignatureModal } from "@/components/assets/AssetQrSignatureModal";
import { StateSimulatorBar } from "@/components/assets/StateSimulatorBar";

export default function AdminAssetsPage() {
  // Data states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<MetricsType>({
    total: 0,
    active: 0,
    inRepair: 0,
    retiredOrAvailable: 0,
    pendingSignature: 0,
  });

  // Simulator & SOP states
  const [userRole, setUserRole] = useState<UserRolePermission>("head_it");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSkeleton, setIsSkeleton] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isEmptySimulated, setIsEmptySimulated] = useState<boolean>(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    status: "",
    location: "",
    pic: "",
  });

  // Modals & Drawers state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = getStoredAssets();
      const m = getAssetMetrics();
      setAssets(data);
      setMetrics(m);
    } catch (err) {
      console.error("Load assets error:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Available unique locations for filter
  const availableLocations = useMemo(() => {
    const set = new Set(assets.map((a) => a.location).filter(Boolean));
    return Array.from(set);
  }, [assets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    if (isEmptySimulated) return [];

    return assets.filter((asset) => {
      // Search by name, serialNumber, or assetTag
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTag = asset.assetTag.toLowerCase().includes(query);
        const matchesName = asset.name.toLowerCase().includes(query);
        const matchesSerial = asset.serialNumber.toLowerCase().includes(query);
        const matchesBrand = asset.brandModel.toLowerCase().includes(query);
        if (!matchesTag && !matchesName && !matchesSerial && !matchesBrand) {
          return false;
        }
      }

      // Category filter
      if (filters.category && asset.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && asset.status !== filters.status) {
        return false;
      }

      // Location filter
      if (filters.location && asset.location !== filters.location) {
        return false;
      }

      // PIC filter
      if (
        filters.pic &&
        !asset.currentPic.toLowerCase().includes(filters.pic.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [assets, filters, isEmptySimulated]);

  // Handlers for mutations
  const handleCreateAsset = async (values: AssetFormValues) => {
    const actorName = userRole === "head_it" ? "Ahmad Fauzi (Head of IT)" : "Staff IT Support";
    const newAsset = createAsset(values, actorName);
    loadData();
    showToast(`Aset ${newAsset.assetTag} (${newAsset.name}) berhasil didaftarkan!`);
  };

  const handleUpdateAsset = async (values: AssetFormValues) => {
    if (!selectedAsset) return;
    const actorName = userRole === "head_it" ? "Ahmad Fauzi (Head of IT)" : "Staff IT Support";
    const updated = updateAsset(selectedAsset.id, values, actorName);
    loadData();
    showToast(`Data aset ${updated.assetTag} berhasil diperbarui!`);
  };

  const handleRetireAsset = (asset: Asset) => {
    if (confirm(`Yakin ingin mengafkirkan aset ${asset.assetTag} (${asset.name})? Status akan diubah ke Afkir.`)) {
      deleteOrRetireAsset(asset.id, "Diafkirkan via menu admin aset");
      loadData();
      showToast(`Aset ${asset.assetTag} telah diafkirkan.`);
    }
  };

  const handleHandoverSubmit = async (assetId: string, values: HandoverFormValues) => {
    const actorName = userRole === "head_it" ? "Ahmad Fauzi (Head of IT)" : "Staff IT Support";
    const handover = createHandover(assetId, values, actorName);
    loadData();
    showToast(`Dokumen ${handover.documentNumber} diterbitkan! QR siap ditandatangani.`);
    // Open QR modal right after handover creation
    const updatedAsset = getStoredAssets().find((a) => a.id === assetId);
    if (updatedAsset) {
      setSelectedAsset(updatedAsset);
      setIsQrModalOpen(true);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "",
      status: "",
      location: "",
      pic: "",
    });
    setIsEmptySimulated(false);
  };

  const handleResetData = () => {
    if (confirm("Reset seluruh data aset & Berita Acara ke kondisi default?")) {
      resetAllAssetData();
      loadData();
      showToast("Data aset berhasil di-reset ke nilai default.");
    }
  };

  const canManage = userRole === "head_it" || userRole === "it_support";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 size={16} className="text-emerald-500" />
          {toastMessage}
        </div>
      )}

      {/* Developer & QA SOP State Simulator Bar */}
      <StateSimulatorBar
        userRole={userRole}
        onRoleChange={setUserRole}
        isLoading={isLoading}
        onToggleLoading={() => setIsLoading(!isLoading)}
        isSkeleton={isSkeleton}
        onToggleSkeleton={() => setIsSkeleton(!isSkeleton)}
        isError={isError}
        onToggleError={() => setIsError(!isError)}
        isEmptySimulated={isEmptySimulated}
        onToggleEmpty={() => setIsEmptySimulated(!isEmptySimulated)}
        onResetData={handleResetData}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              Modul Inventaris Perusahaan
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Total {assets.length} Perangkat
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Boxes className="text-primary" size={28} />
            Pengelolaan Asset
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen siklus hidup inventaris IT, riwayat pergerakan (audit trail), dan penandatanganan Berita Acara Serah Terima (BAST) via QR.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
            title="Muat ulang data"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          {canManage ? (
            <button
              onClick={() => {
                setSelectedAsset(null);
                setFormMode("create");
                setIsFormOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-sm"
            >
              <PlusCircle size={16} />
              Registrasi Aset Baru
            </button>
          ) : (
            <div
              className="text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground font-medium"
              title="Akses Registrasi terbatas untuk role Head of IT dan IT Support"
            >
              Akses Read-Only
            </div>
          )}
        </div>
      </div>

      {/* 4. ERROR STATE DISPLAY */}
      {isError ? (
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-500 mx-auto flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Gagal Memuat Data Inventaris Aset
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Terjadi gangguan saat mengambil data dari database lokal. Silakan coba muat ulang halaman.
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards (with Skeleton support) */}
          <AssetMetrics metrics={metrics} isLoading={isSkeleton || isLoading} />

          {/* Multi-Criteria Filters Bar */}
          <AssetFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            availableLocations={availableLocations}
            totalResults={filteredAssets.length}
          />

          {/* Main Responsive Data Table */}
          <AssetTable
            assets={filteredAssets}
            isLoading={isSkeleton || isLoading}
            userRole={userRole}
            onResetFilters={handleResetFilters}
            onViewDetail={(asset) => {
              setSelectedAsset(asset);
              setIsDetailOpen(true);
            }}
            onEdit={(asset) => {
              setSelectedAsset(asset);
              setFormMode("edit");
              setIsFormOpen(true);
            }}
            onHandover={(asset) => {
              setSelectedAsset(asset);
              setIsHandoverOpen(true);
            }}
            onOpenQrSignature={(asset) => {
              setSelectedAsset(asset);
              setIsQrModalOpen(true);
            }}
            onRetire={handleRetireAsset}
          />
        </>
      )}

      {/* Asset Detail Drawer */}
      <AssetDetailDrawer
        asset={selectedAsset}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        userRole={userRole}
        onEdit={() => {
          setIsDetailOpen(false);
          setFormMode("edit");
          setIsFormOpen(true);
        }}
        onHandover={() => {
          setIsDetailOpen(false);
          setIsHandoverOpen(true);
        }}
        onOpenQrSignature={() => {
          setIsDetailOpen(false);
          setIsQrModalOpen(true);
        }}
      />

      {/* Asset Form Modal (Create / Edit) */}
      <AssetFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={formMode === "create" ? handleCreateAsset : handleUpdateAsset}
        initialData={selectedAsset}
        mode={formMode}
      />

      {/* Asset Handover Modal */}
      <AssetHandoverModal
        asset={selectedAsset}
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
        onSubmit={handleHandoverSubmit}
      />

      {/* QR Signature Modal */}
      <AssetQrSignatureModal
        asset={selectedAsset}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        userRole={userRole}
        onStateChange={loadData}
      />
    </div>
  );
}
