export type AssetCategory =
  | "Laptop"
  | "Desktop"
  | "Monitor"
  | "Server"
  | "Networking"
  | "Peripheral"
  | "Mobile Device"
  | "Lainnya";

export type AssetStatus =
  | "Aktif"
  | "Dalam Perbaikan"
  | "Tersedia"
  | "Afkir";

export type AssetCondition =
  | "Baik"
  | "Rusak Ringan"
  | "Dalam Perbaikan"
  | "Rusak Berat";

export interface Asset {
  id: string;
  assetTag: string; // e.g. "AST-2026-001"
  name: string;
  category: AssetCategory;
  serialNumber: string;
  brandModel: string;
  specs: string;
  location: string;
  currentPic: string;
  currentPicRole: string;
  currentPicEmail: string;
  acquisitionDate: string; // YYYY-MM-DD
  acquisitionValue: number; // IDR
  condition: AssetCondition;
  status: AssetStatus;
  warrantyExpiry: string; // YYYY-MM-DD
  notes: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  activeHandoverId?: string;
}

export type ActionType =
  | "REGISTRATION"
  | "HANDOVER"
  | "STATUS_CHANGE"
  | "MAINTENANCE"
  | "REPAIR_COMPLETED"
  | "RETIRED"
  | "SIGNATURE_COMPLETED"
  | "SIGNATURE_REVOKED";

export interface AuditTrailEntry {
  id: string;
  assetId: string;
  timestamp: string;
  actionType: ActionType;
  actor: string;
  actorRole: string;
  description: string;
  fromPic?: string;
  toPic?: string;
  notes?: string;
  documentNumber?: string;
}

export type SignerRole =
  | "Penyerah (IT)"
  | "Penerima (PIC Baru)"
  | "Mengetahui (Atasan)";

export type SignerState =
  | "pending"
  | "signed"
  | "declined"
  | "expired"
  | "revoked"
  | "superseded";

export interface SignerInfo {
  id: string;
  name: string;
  role: SignerRole;
  email: string;
  token: string; // Secure opaque token
  status: SignerState;
  signedAt?: string;
  signatureCertificate?: string;
  declinedAt?: string;
  declineReason?: string;
  expiresAt: string;
}

export type HandoverStatus =
  | "draft"
  | "pending_signatures"
  | "completed"
  | "declined"
  | "revoked"
  | "superseded";

export interface HandoverRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  documentNumber: string; // e.g. "BAST/IT/2026/03/001"
  documentVersion: string; // e.g. "v1.0"
  status: HandoverStatus;
  transferDate: string;
  reason: string;
  conditionAtTransfer: AssetCondition;
  locationAtTransfer: string;
  notes: string;
  signers: SignerInfo[];
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  revokedReason?: string;
  supersededBy?: string;
}

export type UserRolePermission = "head_it" | "it_support" | "employee";

export interface AssetMetrics {
  total: number;
  active: number;
  inRepair: number;
  retiredOrAvailable: number;
  pendingSignature: number;
}
