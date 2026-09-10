"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  FileSignature,
  FileText,
  User,
  Laptop,
  RotateCcw,
  Loader2,
  Lock,
  ChevronLeft,
} from "lucide-react";
import {
  getHandoverByToken,
  signHandoverByToken,
  declineHandoverByToken,
} from "@/lib/mock-assets";
import { HandoverRecord, SignerInfo } from "@/types/asset";

export default function SignPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [isLoading, setIsLoading] = useState(true);
  const [handover, setHandover] = useState<HandoverRecord | null>(null);
  const [signer, setSigner] = useState<SignerInfo | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isOfflineError, setIsOfflineError] = useState(false);

  // Signer flow state
  const [consentCondition, setConsentCondition] = useState(false);
  const [consentPolicy, setConsentPolicy] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [signSuccessResult, setSignSuccessResult] = useState<{
    certificate: string;
    signedAt: string;
  } | null>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setIsOfflineError(false);
    setTimeout(() => {
      const result = getHandoverByToken(token);
      if (result.handover && result.signer) {
        setHandover(result.handover);
        setSigner(result.signer);
        setIsExpired(Boolean(result.isTokenExpired));

        if (result.signer.status === "signed" && result.signer.signatureCertificate) {
          setSignSuccessResult({
            certificate: result.signer.signatureCertificate,
            signedAt: result.signer.signedAt || new Date().toISOString(),
          });
        }
      } else {
        setHandover(null);
        setSigner(null);
      }
      setIsLoading(false);
    }, 400);
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Memverifikasi Token BAST...
          </h2>
          <p className="text-xs text-muted-foreground">
            Memeriksa keabsahan tanda tangan digital dan dokumen aktif di server.
          </p>
        </div>
      </div>
    );
  }

  // 2. OFFLINE / NETWORK ERROR SIMULATED
  if (isOfflineError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-500 mx-auto flex items-center justify-center">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Koneksi Jaringan Terputus (Offline)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tidak dapat menghubungi server verifikasi tanda tangan digital. Mohon periksa kembali sambungan internet Anda.
          </p>
          <button
            onClick={loadData}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // 3. INVALID TOKEN STATE
  if (!handover || !signer) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <Ban size={28} />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Token Tidak Ditemukan / Tidak Valid
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tautan tanda tangan QR yang Anda akses tidak terdaftar di sistem Berita Acara Serah Terima. Pastikan Anda menggunakan tautan resmi dari IT.
          </p>
          <Link
            href="/admin/assets"
            className="inline-block px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // 4. REVOKED STATE
  if (handover.status === "revoked" || signer.status === "revoked") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
            <Ban size={28} />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Sesi Serah Terima Telah Dicabut (Revoked)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Permintaan tanda tangan untuk dokumen{" "}
            <strong className="text-foreground">{handover.documentNumber}</strong> telah dibatalkan oleh Administrator IT.
          </p>
          {handover.revokedReason && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300 italic text-left">
              Alasan: &ldquo;{handover.revokedReason}&rdquo;
            </div>
          )}
          <Link
            href="/admin/assets"
            className="inline-block px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
          >
            Tutup Portal
          </Link>
        </div>
      </div>
    );
  }

  // 5. SUPERSEDED STATE (Document version replaced)
  if (handover.status === "superseded" || signer.status === "superseded") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
            <FileText size={28} />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Dokumen Telah Digantikan Versi Baru
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dokumen BAST versi <span className="font-mono font-bold">{handover.documentVersion}</span> telah diperbarui ke versi lebih baru ({handover.supersededBy || "v2.0"}). Token ini tidak lagi berlaku untuk mencegah persetujuan pada draf lama.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Silakan periksa notifikasi email Anda untuk mendapatkan tautan tanda tangan dokumen terbaru.
          </p>
        </div>
      </div>
    );
  }

  // 6. EXPIRED STATE
  if (isExpired || signer.status === "expired") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 mx-auto flex items-center justify-center">
            <Clock size={28} />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Tautan Tanda Tangan Kedaluwarsa
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Masa berlaku tautan tanda tangan untuk dokumen{" "}
            <strong className="text-foreground">{handover.documentNumber}</strong> telah berakhir pada{" "}
            {new Date(signer.expiresAt).toLocaleDateString("id-ID")}.
          </p>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-muted-foreground">
            Hubungi Tim IT di <strong>it.support@digitaltech.id</strong> untuk meminta penerbitan ulang QR link.
          </div>
        </div>
      </div>
    );
  }

  // 7. DECLINED STATE
  if (signer.status === "declined") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 mx-auto flex items-center justify-center">
            <Ban size={28} />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Serah Terima Telah Ditolak
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Anda telah menolak serah terima unit ini pada{" "}
            {signer.declinedAt ? new Date(signer.declinedAt).toLocaleString("id-ID") : "sebelumnya"}.
          </p>
          {signer.declineReason && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-left text-muted-foreground">
              <strong>Alasan Penolakan:</strong> &ldquo;{signer.declineReason}&rdquo;
            </div>
          )}
        </div>
      </div>
    );
  }

  // 8. ALREADY SIGNED / SUCCESS STATE
  if (signSuccessResult || signer.status === "signed") {
    const cert = signSuccessResult?.certificate || signer.signatureCertificate || "CERT-VALID";
    const signedDate = signSuccessResult?.signedAt || signer.signedAt || new Date().toISOString();

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-8 max-w-lg w-full text-center shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center animate-in zoom-in-90 duration-300">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Dokumen Terverifikasi Secara Digital
            </span>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2">
              Tanda Tangan Digital Berhasil!
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Berita Acara Serah Terima telah sah ditandatangani oleh{" "}
              <strong className="text-foreground">{signer.name}</strong> ({signer.role}).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nomor Dokumen:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {handover.documentNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Versi BAST:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {handover.documentVersion}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Waktu Penandatanganan:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {new Date(signedDate).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-muted-foreground">Kode Sertifikat Digital:</span>
              <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {cert}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link
              href="/admin/assets"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              Lihat Dashboard Aset
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 9. PENDING SIGNATURE (The Primary Scan-to-Sign Workflow)
  const canSubmitSign = consentCondition && consentPolicy && !isSigning;

  const handleExecuteSign = async () => {
    try {
      setIsSigning(true);
      await new Promise((r) => setTimeout(r, 600)); // Smooth UX feel
      const result = signHandoverByToken(token, signer.name);
      if (result.success && result.handover) {
        const mySigner = result.handover.signers.find((s) => s.token === token);
        setSignSuccessResult({
          certificate: mySigner?.signatureCertificate || "CERT-VERIFIED",
          signedAt: mySigner?.signedAt || new Date().toISOString(),
        });
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error("Signing error:", err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleExecuteDecline = async () => {
    if (!declineReason.trim()) return;
    try {
      setIsSigning(true);
      const result = declineHandoverByToken(token, declineReason);
      if (result.success) {
        setShowDeclineModal(false);
        loadData();
      }
    } catch (err) {
      console.error("Decline error:", err);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/assets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} /> Kembali ke Inventaris
          </Link>
          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
            <Lock size={12} className="text-emerald-500" /> Sambungan Aman TLS
          </span>
        </div>

        {/* Main Document Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Document Header Banner */}
          <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-950 text-white">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-white/10 font-bold">
                {handover.documentNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 font-semibold">
                Versi {handover.documentVersion} (Aktif)
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight">
              Berita Acara Serah Terima Aset IT
            </h1>
            <p className="text-xs text-purple-200 mt-0.5">
              Portal Verifikasi Tanda Tangan Digital Resmi PT Digital Tech Multi Akses
            </p>
          </div>

          <div className="p-6 space-y-6 text-xs">
            {/* Signer Identity Verification */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5">
                <User size={18} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Verifikasi Identitas Penandatangan
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {signer.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Peran: <strong className="text-foreground">{signer.role}</strong> • Email:{" "}
                  {signer.email}
                </div>
              </div>
            </div>

            {/* Parties Summary (Multi-Signer Overview) */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                Para Pihak Dalam Dokumen:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {handover.signers.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3 rounded-xl border text-xs ${
                      s.token === token
                        ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 font-semibold ring-1 ring-purple-400/30"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-muted-foreground"
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
                      {s.role}
                    </div>
                    <div className="text-zinc-900 dark:text-zinc-100 font-bold truncate">
                      {s.name}
                    </div>
                    <div className="text-[10px] mt-1 flex items-center gap-1">
                      {s.status === "signed" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 size={11} /> Sudah TTD
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                          <Clock size={11} /> Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Details Summary */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/60 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Laptop size={14} /> Detail Aset Yang Diserahkan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Tag AST:</span>
                  <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {handover.assetTag}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Nama Perangkat:</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {handover.assetName}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Kondisi Fisik Saat Serah Terima:</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {handover.conditionAtTransfer}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Lokasi Baru Penempatan:</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {handover.locationAtTransfer}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Alasan & Catatan Serah Terima:</span>
                  <p className="text-zinc-700 dark:text-zinc-300 italic mt-0.5">
                    &ldquo;{handover.reason}&rdquo; {handover.notes ? `(${handover.notes})` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Consent Checklist (Mandatory before signing) */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                Persetujuan & Pernyataan Hukum:
              </h3>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentCondition}
                  onChange={(e) => setConsentCondition(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-zinc-300"
                />
                <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed group-hover:text-foreground">
                  Saya telah memeriksa fisik dan kelengkapan perangkat di atas, serta memastikan kondisi dan spesifikasi sesuai dengan data Berita Acara.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentPolicy}
                  onChange={(e) => setConsentPolicy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-zinc-300"
                />
                <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed group-hover:text-foreground">
                  Saya menyetujui tanggung jawab pemeliharaan aset sesuai Kebijakan IT Perusahaan dan bersedia mengembalikan unit saat rotasi atau pengakhiran kontrak kerja.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowDeclineModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/50 transition-colors text-center"
              >
                Tolak Serah Terima (Decline)
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={!canSubmitSign}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all"
              >
                <FileSignature size={16} />
                Tanda Tangani Berita Acara
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accidental Signing Prevention (2-Step Confirmation Modal) */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Konfirmasi Akhir Tanda Tangan Digital
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Pencegahan Tanda Tangan Tidak Sengaja
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
              Dengan melanjutkan konfirmasi ini:
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                <li>Tanda tangan digital Anda akan diterbitkan dengan sertifikat unik SHA-256.</li>
                <li>Tanggung jawab aset resmi dialihkan atas nama Anda di database inventaris IT.</li>
                <li>Status dokumen BAST akan tercatat sebagai sah dan mengikat.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSigning}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleExecuteSign}
                disabled={isSigning}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSigning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Menerbitkan Tanda Tangan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Ya, Konfirmasi & Tanda Tangani
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Dialog */}
      {showDeclineModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/60">
                <Ban size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Tolak Serah Terima Aset
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Berikan catatan alasan penolakan untuk tim IT
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Jika terdapat ketidaksesuaian kondisi fisik atau kelengkapan perangkat, cantumkan alasan di bawah ini agar tim IT dapat menindaklanjuti.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Alasan Penolakan: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Contoh: Unit mengalami goresan layar atau adaptor charger tidak disertakan..."
                rows={3}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                disabled={isSigning}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDecline}
                disabled={!declineReason.trim() || isSigning}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
