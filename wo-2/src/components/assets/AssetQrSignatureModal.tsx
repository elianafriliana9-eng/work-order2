"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Send,
  Ban,
  FileSignature,
  FileText,
  Lock,
} from "lucide-react";
import { Asset, HandoverRecord, SignerInfo, UserRolePermission } from "@/types/asset";
import {
  getHandoverByAssetId,
  revokeHandoverSession,
  resendSignerNotification,
} from "@/lib/mock-assets";
import { QrCodeSvg } from "./QrCodeSvg";

interface AssetQrSignatureModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRolePermission;
  onStateChange?: () => void;
}

export function AssetQrSignatureModal({
  asset,
  isOpen,
  onClose,
  userRole,
  onStateChange,
}: AssetQrSignatureModalProps) {
  const [overriddenHandover, setOverriddenHandover] = useState<HandoverRecord | null>(null);
  const [selectedSignerIndex, setSelectedSignerIndex] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canManage = userRole === "head_it" || userRole === "it_support";

  const activeHandover = useMemo(() => {
    if (!asset || !isOpen) return null;
    return getHandoverByAssetId(asset.id) || null;
  }, [asset, isOpen]);

  const handover = overriddenHandover ?? activeHandover;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRevokeModal) {
          setShowRevokeModal(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, showRevokeModal, onClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen || !asset) return null;

  const currentSigner: SignerInfo | undefined =
    handover?.signers?.[selectedSignerIndex] || handover?.signers?.[0];

  const getSignerUrl = (token?: string) => {
    if (!token) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/assets/sign/${token}`;
  };

  const handleCopyFallback = () => {
    if (!currentSigner) return;
    const url = getSignerUrl(currentSigner.token);
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast("Link fallback tanda tangan berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResendNotification = (signer: SignerInfo) => {
    if (!handover) return;
    const res = resendSignerNotification(handover.id, signer.id);
    if (res.success) {
      showToast(res.message);
    }
  };

  const handleRevokeConfirm = () => {
    if (!handover || !revokeReason.trim()) return;
    const res = revokeHandoverSession(handover.id, revokeReason, "Ahmad Fauzi (Head of IT)");
    if (res.success && res.handover) {
      setOverriddenHandover(res.handover);
      setShowRevokeModal(false);
      setRevokeReason("");
      showToast(res.message);
      if (onStateChange) onStateChange();
    }
  };

  const getSignerStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
            <CheckCircle2 size={12} /> Selesai TTD
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
            <Clock size={12} className="animate-spin" /> Menunggu TTD
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200/60 dark:border-red-800">
            <Ban size={12} /> Ditolak
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            <AlertTriangle size={12} /> Kedaluwarsa
          </span>
        );
      case "revoked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            <ShieldAlert size={12} /> Dicabut (Revoked)
          </span>
        );
      case "superseded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <FileText size={12} /> Versi Lama
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 size={16} className="text-emerald-500" />
          {toastMessage}
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="qr-modal-title"
                  className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                >
                  Tanda Tangan Digital BAST via QR
                </h2>
                {handover && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {handover.documentVersion}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Dokumen:{" "}
                <strong className="font-mono text-foreground">
                  {handover?.documentNumber || "Draft BAST"}
                </strong>{" "}
                • {asset.assetTag} ({asset.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Tutup modal QR"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {!handover ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 mx-auto flex items-center justify-center">
              <FileSignature size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Belum Ada Sesi BAST Aktif
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Aset {asset.assetTag} saat ini tidak memiliki Berita Acara Serah Terima yang sedang berjalan. Lakukan inisiasi serah terima untuk menerbitkan QR code tanda tangan digital.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Kembali ke Inventaris
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Status Alert if Revoked or Superseded */}
            {handover.status === "revoked" && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 flex items-start gap-3">
                <ShieldAlert size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-200">
                    Sesi BAST Telah Dicabut (Revoked)
                  </h4>
                  <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                    {handover.revokedReason || "Sesi serah terima ini telah dibatalkan oleh Administrator IT."}
                  </p>
                </div>
              </div>
            )}

            {handover.status === "superseded" && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">
                    Dokumen Telah Digantikan Versi Baru
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Dokumen ini digantikan oleh {handover.supersededBy || "versi berikutnya"}. QR token ini sudah tidak berlaku.
                  </p>
                </div>
              </div>
            )}

            {/* Signer Tabs Selector */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Pilih Pihak Penandatangan (Multi-Signer):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {handover.signers.map((signer, idx) => {
                  const isSelected = selectedSignerIndex === idx;
                  return (
                    <button
                      key={signer.id}
                      onClick={() => setSelectedSignerIndex(idx)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-600/20"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          {signer.role.split(" ")[0]}
                        </span>
                        {getSignerStatusBadge(signer.status)}
                      </div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {signer.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {signer.email}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QR Code Presentation Box */}
            {currentSigner && (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 bg-zinc-50/50 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center gap-6">
                {/* QR SVG container */}
                <div className="flex flex-col items-center shrink-0">
                  <QrCodeSvg token={currentSigner.token} size={180} />
                  <span className="text-[10px] font-mono text-muted-foreground mt-2 flex items-center gap-1">
                    <Lock size={10} /> Secure Opaque Token (No PII)
                  </span>
                </div>

                {/* Signer Detail & Actions */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        {currentSigner.role}
                      </span>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                        {currentSigner.name}
                      </h3>
                    </div>
                    {getSignerStatusBadge(currentSigner.status)}
                  </div>

                  {/* Expiry and Certificate info */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Kedaluwarsa:</span>
                      <span className="font-medium text-foreground">
                        {new Date(currentSigner.expiresAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </span>
                    </div>

                    {currentSigner.signedAt && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Ditandatangani:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {new Date(currentSigner.signedAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}

                    {currentSigner.signatureCertificate && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Sertifikat Digital:</span>
                        <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          {currentSigner.signatureCertificate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fallback Copyable Link */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Link Fallback Alternatif (Aman & Terenkripsi):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getSignerUrl(currentSigner.token)}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all"
                      />
                      <button
                        onClick={handleCopyFallback}
                        className="px-3 py-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0"
                        title="Salin link fallback"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {copied ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                  </div>

                  {/* Direct Test Portal & Resend Notification */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={`/assets/sign/${currentSigner.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-200 transition-colors"
                    >
                      <ExternalLink size={13} />
                      Buka Portal Tanda Tangan
                    </a>

                    <button
                      onClick={() => handleResendNotification(currentSigner)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground font-medium"
                    >
                      <Send size={13} />
                      Kirim Ulang Notifikasi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Document Version & Security Notice */}
            <div className="p-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800 flex items-start gap-2.5 text-[11px] text-muted-foreground">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong>Standar Keamanan SOP Digital Tech IT:</strong> Payload QR Code dan tautan fallback hanya memuat token acak terisolasi (opaque token). Tidak ada data PII (seperti NIK, nama lengkap, atau serial number perangkat) yang diekspos dalam muatan QR atau atribut DOM publik.
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {handover && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 flex items-center justify-between gap-2 shrink-0">
            {canManage && handover.status === "pending_signatures" ? (
              <button
                onClick={() => setShowRevokeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors"
              >
                <Ban size={14} />
                Cabut Sesi BAST (Revoke)
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Revoke Action */}
      {showRevokeModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/50">
                <ShieldAlert size={20} />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Konfirmasi Pencabutan (Revoke) BAST
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tindakan ini akan membatalkan seluruh link tanda tangan QR untuk semua pihak penandatangan pada dokumen{" "}
              <strong className="text-foreground">{handover?.documentNumber}</strong>. Status sesi akan dialihkan ke Revoked.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Alasan Pencabutan Sesi: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Contoh: Kesalahan input spesifikasi atau pergantian personil penerima..."
                rows={3}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={!revokeReason.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                Ya, Cabut Sesi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
