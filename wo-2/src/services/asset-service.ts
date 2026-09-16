import {
  Asset,
  AssetCategory,
  AssetStatus,
  AssetCondition,
  AuditTrailEntry,
  HandoverRecord,
  SignerInfo,
  SignerState,
  HandoverStatus,
  AssetMetrics,
} from "@/types/asset";
import {
  getStoredAssets,
  getStoredAudit,
  getStoredHandovers,
  createAsset as mockCreateAsset,
  updateAsset as mockUpdateAsset,
  createHandover as mockCreateHandover,
  signHandoverByToken as mockSignHandoverByToken,
  revokeHandoverSession as mockRevokeHandoverSession,
  getAssetMetrics as mockGetAssetMetrics,
} from "@/lib/mock-assets";
import { AssetFormValues, HandoverFormValues, assetRegistrationSchema, assetHandoverSchema } from "@/lib/asset-schemas";
import { ApiErrorCode } from "@/types/api";

export class AssetServiceError extends Error {
  code: ApiErrorCode;
  statusCode: number;
  details?: any[];

  constructor(code: ApiErrorCode, message: string, statusCode = 400, details?: any[]) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AssetServiceError.prototype);
  }
}

export interface ListAssetFilters {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  userRole?: string;
  userEmail?: string;
}

export class AssetService {
  /**
   * Mengambil daftar aset dengan pagination, filter, dan pembatasan role RLS
   */
  static async listAssets(filters: ListAssetFilters) {
    let assets = getStoredAssets();

    // RLS emulation: user/employee hanya melihat aset yang ditugaskan ke dirinya
    if (filters.userRole === "user" || filters.userRole === "employee") {
      if (filters.userEmail) {
        assets = assets.filter(
          (a) => a.currentPicEmail?.toLowerCase() === filters.userEmail?.toLowerCase()
        );
      }
    }

    if (filters.category && filters.category !== "all") {
      assets = assets.filter((a) => a.category === filters.category);
    }

    if (filters.status && filters.status !== "all") {
      assets = assets.filter((a) => a.status === filters.status);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.assetTag.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          a.currentPic.toLowerCase().includes(q) ||
          a.brandModel.toLowerCase().includes(q)
      );
    }

    const total = assets.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const offset = (page - 1) * limit;
    const paginated = assets.slice(offset, offset + limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mengambil detail aset berdasarkan ID beserta riwayat BAST & Audit Trail
   */
  static async getAssetById(id: string, userRole?: string, userEmail?: string) {
    const assets = getStoredAssets();
    const asset = assets.find((a) => a.id === id);

    if (!asset) {
      throw new AssetServiceError(
        "ERR_ASSET_NOT_FOUND",
        `Aset dengan ID '${id}' tidak ditemukan.`,
        404
      );
    }

    // Role check
    if (userRole === "user" || userRole === "employee") {
      if (asset.currentPicEmail?.toLowerCase() !== userEmail?.toLowerCase()) {
        throw new AssetServiceError(
          "ERR_FORBIDDEN_ROLE",
          "Anda tidak memiliki izin untuk mengakses data aset ini.",
          403
        );
      }
    }

    const allAudit = getStoredAudit();
    const auditTrail = allAudit.filter((entry) => entry.assetId === id);

    const allHandovers = getStoredHandovers();
    const handovers = allHandovers.filter((h) => h.assetId === id);

    return {
      asset,
      auditTrail,
      handovers,
    };
  }

  /**
   * Mendaftarkan unit aset baru dengan validasi skema server & generate Tag AST
   */
  static async createAsset(
    payload: AssetFormValues,
    actor: { id?: string; name: string; role: string }
  ) {
    if (actor.role !== "head_it" && actor.role !== "admin" && actor.role !== "it_support") {
      throw new AssetServiceError(
        "ERR_FORBIDDEN_ROLE",
        "Hanya tim IT yang berhak mendaftarkan aset baru ke dalam sistem.",
        403
      );
    }

    // Server-side Zod validation
    const parsed = assetRegistrationSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AssetServiceError(
        "ERR_VALIDATION_FAILED",
        "Data registrasi aset tidak valid.",
        422,
        parsed.error.issues
      );
    }

    const assets = getStoredAssets();

    // Check duplicate Serial Number
    const existingSn = assets.find(
      (a) => a.serialNumber.trim().toLowerCase() === payload.serialNumber.trim().toLowerCase()
    );
    if (existingSn) {
      throw new AssetServiceError(
        "ERR_SERIAL_ALREADY_EXISTS",
        `Serial Number '${payload.serialNumber}' sudah terdaftar pada aset ${existingSn.assetTag} (${existingSn.name}).`,
        409
      );
    }

    const created = mockCreateAsset(payload, actor.name);
    return created;
  }

  /**
   * Memperbarui informasi aset dengan enforcement immutability tag & audit logging
   */
  static async updateAsset(
    id: string,
    payload: Partial<AssetFormValues>,
    actor: { id?: string; name: string; role: string }
  ) {
    if (actor.role !== "head_it" && actor.role !== "admin" && actor.role !== "it_support") {
      throw new AssetServiceError(
        "ERR_FORBIDDEN_ROLE",
        "Hanya tim IT yang berwenang memperbarui data aset.",
        403
      );
    }

    const assets = getStoredAssets();
    const existing = assets.find((a) => a.id === id);
    if (!existing) {
      throw new AssetServiceError(
        "ERR_ASSET_NOT_FOUND",
        `Aset dengan ID '${id}' tidak ditemukan.`,
        404
      );
    }

    // Enforce Tag Immutability (DEC-AST-02)
    if ((payload as any).assetTag && (payload as any).assetTag !== existing.assetTag) {
      throw new AssetServiceError(
        "ERR_INVALID_TRANSITION",
        "Asset Tag bersifat immutable dan tidak dapat diubah setelah diterbitkan.",
        400
      );
    }

    const updated = mockUpdateAsset(id, payload, actor.name);
    if (!updated) {
      throw new AssetServiceError(
        "ERR_INTERNAL_SERVER",
        "Gagal menyimpan pembaruan aset.",
        500
      );
    }

    return updated;
  }

  /**
   * Transisi status operasional aset dengan kepatuhan state machine
   */
  static async transitionStatus(
    id: string,
    newStatus: AssetStatus,
    reason: string,
    actor: { id?: string; name: string; role: string }
  ) {
    const assets = getStoredAssets();
    const existing = assets.find((a) => a.id === id);
    if (!existing) {
      throw new AssetServiceError(
        "ERR_ASSET_NOT_FOUND",
        `Aset dengan ID '${id}' tidak ditemukan.`,
        404
      );
    }

    // Aturan transisi state
    if (newStatus === "Afkir" && actor.role !== "head_it" && actor.role !== "admin") {
      throw new AssetServiceError(
        "ERR_FORBIDDEN_ROLE",
        "Hanya Head of IT yang berwenang menetapkan aset ke status Afkir (Decommission).",
        403
      );
    }

    if (existing.status === "Afkir" && newStatus !== "Afkir") {
      throw new AssetServiceError(
        "ERR_INVALID_TRANSITION",
        "Aset yang sudah berstatus Afkir merupakan terminal state dan tidak dapat diaktifkan kembali.",
        422
      );
    }

    if (newStatus === "Aktif" && !existing.currentPic) {
      throw new AssetServiceError(
        "ERR_INVALID_TRANSITION",
        "Aset tidak dapat berstatus Aktif tanpa adanya penanggung jawab PIC sah melalui BAST.",
        422
      );
    }

    const updated = mockUpdateAsset(id, { status: newStatus, notes: `${existing.notes} | Status berubah ke ${newStatus}: ${reason}` }, actor.name);
    return updated;
  }

  /**
   * Inisiasi alur BAST Handover dan pembuatan QR signers
   */
  static async initiateHandover(
    assetId: string,
    payload: HandoverFormValues,
    actor: { id?: string; name: string; role: string }
  ) {
    if (actor.role !== "head_it" && actor.role !== "admin" && actor.role !== "it_support") {
      throw new AssetServiceError(
        "ERR_FORBIDDEN_ROLE",
        "Hanya tim IT yang berhak membuat sesi serah terima BAST.",
        403
      );
    }

    const parsed = assetHandoverSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AssetServiceError(
        "ERR_VALIDATION_FAILED",
        "Data formulir serah terima BAST tidak valid.",
        422,
        parsed.error.issues
      );
    }

    const handover = mockCreateHandover(assetId, payload, actor.name);
    return handover;
  }

  /**
   * Verifikasi token QR signer (Aman untuk portal publik /assets/sign/[token])
   */
  static async getSignerByToken(token: string) {
    const handovers = getStoredHandovers();
    const assets = getStoredAssets();

    for (const h of handovers) {
      const signer = h.signers.find((s) => s.token === token);
      if (signer) {
        const asset = assets.find((a) => a.id === h.assetId);
        return {
          handover: h,
          signer,
          asset,
        };
      }
    }

    throw new AssetServiceError(
      "ERR_ASSET_NOT_FOUND",
      "Token tanda tangan tidak valid atau sesi serah terima tidak ditemukan.",
      404
    );
  }

  /**
   * Eksekusi tanda tangan digital via QR token
   */
  static async submitSignature(
    token: string,
    signatureCertificate: string,
    metadata?: { ip?: string; userAgent?: string }
  ) {
    const handovers = getStoredHandovers();
    let targetHandover: HandoverRecord | undefined;
    let targetSigner: SignerInfo | undefined;

    for (const h of handovers) {
      const s = h.signers.find((signer) => signer.token === token);
      if (s) {
        targetHandover = h;
        targetSigner = s;
        break;
      }
    }

    if (!targetHandover || !targetSigner) {
      throw new AssetServiceError(
        "ERR_ASSET_NOT_FOUND",
        "Token tanda tangan tidak valid.",
        404
      );
    }

    if (targetSigner.status === "signed") {
      throw new AssetServiceError(
        "ERR_ALREADY_SIGNED",
        `Tanda tangan untuk ${targetSigner.name} (${targetSigner.role}) telah tercatat sebelumnya.`,
        409
      );
    }

    if (targetHandover.status === "revoked") {
      throw new AssetServiceError(
        "ERR_INVALID_TRANSITION",
        "Sesi BAST ini telah dibatalkan (revoked) oleh Administrator IT.",
        410
      );
    }

    const result = mockSignHandoverByToken(token, targetSigner.name);
    if (!result.success) {
      throw new AssetServiceError(
        "ERR_INTERNAL_SERVER",
        result.message,
        500
      );
    }

    return result;
  }

  /**
   * Mengambil metrik ringkasan inventaris
   */
  static async getMetrics(): Promise<AssetMetrics> {
    return mockGetAssetMetrics();
  }
}
