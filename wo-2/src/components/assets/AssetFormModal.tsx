"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, PlusCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  assetFormSchema,
  AssetFormValues,
  assetCategories,
  assetStatuses,
  assetConditions,
} from "@/lib/asset-schemas";
import { Asset } from "@/types/asset";

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AssetFormValues) => Promise<void> | void;
  initialData?: Asset | null;
  mode: "create" | "edit";
}

export function AssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: AssetFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetFormSchema),
    mode: "onBlur",
    defaultValues: {
      assetTag: "",
      name: "",
      category: "Laptop",
      serialNumber: "",
      brandModel: "",
      specs: "",
      location: "Head Office - Lt. 2",
      currentPic: "",
      currentPicRole: "",
      currentPicEmail: "",
      acquisitionDate: new Date().toISOString().split("T")[0],
      acquisitionValue: 15000000,
      condition: "Baik",
      status: "Aktif",
      warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      reset({
        assetTag: initialData.assetTag,
        name: initialData.name,
        category: initialData.category,
        serialNumber: initialData.serialNumber,
        brandModel: initialData.brandModel,
        specs: initialData.specs,
        location: initialData.location,
        currentPic: initialData.currentPic,
        currentPicRole: initialData.currentPicRole,
        currentPicEmail: initialData.currentPicEmail,
        acquisitionDate: initialData.acquisitionDate,
        acquisitionValue: initialData.acquisitionValue,
        condition: initialData.condition,
        status: initialData.status,
        warrantyExpiry: initialData.warrantyExpiry,
        notes: initialData.notes || "",
      });
    } else if (mode === "create") {
      reset({
        assetTag: `AST-2026-${String(Math.floor(10 + Math.random() * 900))}`,
        name: "",
        category: "Laptop",
        serialNumber: "",
        brandModel: "",
        specs: "",
        location: "Head Office - Lt. 2",
        currentPic: "",
        currentPicRole: "",
        currentPicEmail: "",
        acquisitionDate: new Date().toISOString().split("T")[0],
        acquisitionValue: 15000000,
        condition: "Baik",
        status: "Aktif",
        warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        notes: "",
      });
    }
  }, [initialData, mode, reset, isOpen]);

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

  if (!isOpen) return null;

  const handleFormSubmit = async (data: AssetFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onClose();
    } catch (err) {
      console.error("Submit asset error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-form-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              {mode === "create" ? <PlusCircle size={18} /> : <Save size={18} />}
            </div>
            <div>
              <h2
                id="asset-form-title"
                className="text-base font-bold text-zinc-900 dark:text-zinc-50"
              >
                {mode === "create" ? "Registrasi Aset Baru" : "Edit Informasi Aset"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === "create"
                  ? "Tambahkan inventaris perangkat baru ke sistem terpusat."
                  : `Perbarui data spesifikasi dan PIC untuk aset ${initialData?.assetTag}.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Tutup form"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
        >
          {/* Section 1: Identitas Aset */}
          <div className="space-y-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              1. Identitas & Tipe Perangkat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tag AST <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("assetTag")}
                  disabled={isSubmitting}
                  placeholder="AST-2026-001"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl font-mono focus:outline-none focus:ring-2 transition-all ${
                    errors.assetTag
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.assetTag && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.assetTag.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kategori Aset <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("category")}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                >
                  {assetCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.category.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Aset <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  disabled={isSubmitting}
                  placeholder="Contoh: MacBook Pro 16 M3 Max"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nomor Seri (Serial Number) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("serialNumber")}
                  disabled={isSubmitting}
                  placeholder="C02G1829MD6R"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl font-mono focus:outline-none focus:ring-2 transition-all ${
                    errors.serialNumber
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.serialNumber && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.serialNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Merk / Model Detail <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("brandModel")}
                  disabled={isSubmitting}
                  placeholder="Apple MacBook Pro 16 (Space Black)"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.brandModel
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.brandModel && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.brandModel.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Spesifikasi Teknis <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("specs")}
                  disabled={isSubmitting}
                  rows={2}
                  placeholder="CPU, RAM, Storage, Layar, GPU, dan informasi spesifikasi hardware lainnya..."
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all font-mono text-xs ${
                    errors.specs
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.specs && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.specs.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan & PIC */}
          <div className="space-y-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              2. Lokasi & PIC Penanggung Jawab
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Lokasi Penempatan <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("location")}
                  disabled={isSubmitting}
                  placeholder="Contoh: Head Office - Lt. 2 (IT & Product)"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.location
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.location && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama PIC <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("currentPic")}
                  disabled={isSubmitting}
                  placeholder="Budi Santoso"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.currentPic
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.currentPic && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.currentPic.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Jabatan PIC <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("currentPicRole")}
                  disabled={isSubmitting}
                  placeholder="Lead Frontend Engineer"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.currentPicRole
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.currentPicRole && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.currentPicRole.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email PIC Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("currentPicEmail")}
                  disabled={isSubmitting}
                  placeholder="budi.santoso@digitaltech.id"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.currentPicEmail
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.currentPicEmail && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.currentPicEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Status, Finansial & Garansi */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              3. Finansial, Status & Masa Garansi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Status Operasional <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("status")}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                >
                  {assetStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kondisi Fisik <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("condition")}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                >
                  {assetConditions.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tanggal Perolehan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("acquisitionDate")}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Masa Garansi Hingga <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("warrantyExpiry")}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nilai Perolehan (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register("acquisitionValue")}
                  disabled={isSubmitting}
                  placeholder="15000000"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  {...register("notes")}
                  disabled={isSubmitting}
                  placeholder="Keterangan kelengkapan atau PO..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Menyimpan...
                </>
              ) : mode === "create" ? (
                <>
                  <PlusCircle size={14} />
                  Daftarkan Aset
                </>
              ) : (
                <>
                  <Save size={14} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
