"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  ArrowRightLeft,
  User,
  Shield,
  FileCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  handoverFormSchema,
  HandoverFormValues,
  assetConditions,
} from "@/lib/asset-schemas";
import { Asset, HandoverRecord } from "@/types/asset";

interface AssetHandoverModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assetId: string, values: HandoverFormValues) => Promise<HandoverRecord | void> | void;
}

export function AssetHandoverModal({
  asset,
  isOpen,
  onClose,
  onSubmit,
}: AssetHandoverModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(handoverFormSchema),
    mode: "onBlur",
    defaultValues: {
      newPic: "",
      newPicRole: "",
      newPicEmail: "",
      transferDate: new Date().toISOString().split("T")[0],
      reason: "",
      condition: "Baik",
      location: "Head Office - Lt. 2",
      notes: "",
      signerItName: "Ahmad Fauzi",
      signerItEmail: "ahmad.fauzi@digitaltech.id",
      signerSupervisorName: "Edy Hartono Nasrah",
      signerSupervisorEmail: "edy.hartono@digitaltech.id",
    },
  });

  useEffect(() => {
    if (asset) {
      reset({
        newPic: "",
        newPicRole: "",
        newPicEmail: "",
        transferDate: new Date().toISOString().split("T")[0],
        reason: "",
        condition: asset.condition,
        location: asset.location,
        notes: "",
        signerItName: "Ahmad Fauzi",
        signerItEmail: "ahmad.fauzi@digitaltech.id",
        signerSupervisorName: "Edy Hartono Nasrah",
        signerSupervisorEmail: "edy.hartono@digitaltech.id",
      });
    }
  }, [asset, reset, isOpen]);

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

  const handleFormSubmit = async (data: HandoverFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(asset.id, data);
      onClose();
    } catch (err) {
      console.error("Submit handover error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h2
                id="handover-title"
                className="text-base font-bold text-zinc-900 dark:text-zinc-50"
              >
                Inisiasi Serah Terima Aset (BAST)
              </h2>
              <p className="text-xs text-muted-foreground">
                Transfer hak tanggung jawab unit{" "}
                <strong className="text-foreground">{asset.assetTag}</strong> ({asset.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Tutup form serah terima"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current PIC banner */}
        <div className="px-5 py-3 bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">PIC Saat Ini:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {asset.currentPic}
            </span>
            <span className="text-[11px] text-muted-foreground">({asset.currentPicRole})</span>
          </div>
          <div className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            Status: {asset.status}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
        >
          {/* Section 1: Data Penerima Baru */}
          <div className="space-y-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User size={14} className="text-blue-500" />
              1. PIC Baru (Penerima Hak Pakai)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Lengkap Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("newPic")}
                  disabled={isSubmitting}
                  placeholder="Contoh: Hendra Wijaya"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.newPic
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.newPic && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.newPic.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Jabatan / Divisi <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("newPicRole")}
                  disabled={isSubmitting}
                  placeholder="Software Engineer"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.newPicRole
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.newPicRole && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.newPicRole.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("newPicEmail")}
                  disabled={isSubmitting}
                  placeholder="hendra.wijaya@digitaltech.id"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.newPicEmail
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.newPicEmail && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.newPicEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Detail Serah Terima */}
          <div className="space-y-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileCheck size={14} className="text-emerald-500" />
              2. Ketentuan & Kondisi Perangkat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tanggal Serah Terima <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("transferDate")}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kondisi Aset Saat Ini <span className="text-red-500">*</span>
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

              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Lokasi Baru Penempatan <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("location")}
                  disabled={isSubmitting}
                  placeholder="Head Office - Lt. 2 (IT & Engineering)"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Alasan Serah Terima / Rotasi <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("reason")}
                  disabled={isSubmitting}
                  rows={2}
                  placeholder="Contoh: Rotasi perangkat kerja internal untuk tim Frontend..."
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.reason
                      ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  }`}
                />
                {errors.reason && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.reason.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Konfigurasi Multi-Signer BAST */}
          <div className="space-y-3">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Shield size={14} className="text-purple-500" />
              3. Para Pihak Penandatangan Berita Acara (Multi-Signer)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Dokumen BAST versi 1.0 akan diterbitkan dengan 3 pihak penandatangan terverifikasi:
            </p>

            <div className="space-y-2">
              {/* Signer 1: IT Penyerah */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-1">
                  Pihak I: Penyerah (IT Administrator)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register("signerItName")}
                    disabled={isSubmitting}
                    placeholder="Nama IT Penyerah"
                    className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  />
                  <input
                    {...register("signerItEmail")}
                    disabled={isSubmitting}
                    placeholder="email.it@digitaltech.id"
                    className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Signer 2: Penerima (Auto synced) */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Pihak II: Penerima (PIC Baru)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Otomatis terisi dari data PIC Baru di atas. Akan menerima QR code & link tanda tangan digital unik.
                </p>
              </div>

              {/* Signer 3: Atasan Langsung */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Pihak III: Mengetahui (Atasan Langsung)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register("signerSupervisorName")}
                    disabled={isSubmitting}
                    placeholder="Nama Atasan"
                    className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  />
                  <input
                    {...register("signerSupervisorEmail")}
                    disabled={isSubmitting}
                    placeholder="email.atasan@digitaltech.id"
                    className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Menerbitkan BAST...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={14} />
                  Terbitkan BAST & Buat QR
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
