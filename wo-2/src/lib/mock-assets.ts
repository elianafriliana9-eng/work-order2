import {
  Asset,
  AuditTrailEntry,
  HandoverRecord,
  AssetMetrics,
  SignerInfo,
} from "@/types/asset";
import { AssetFormValues, HandoverFormValues } from "./asset-schemas";

const STORAGE_KEY_ASSETS = "wo2_assets_data_v1";
const STORAGE_KEY_AUDIT = "wo2_assets_audit_v1";
const STORAGE_KEY_HANDOVERS = "wo2_assets_handovers_v1";

const INITIAL_ASSETS: Asset[] = [
  {
    id: "ast-001",
    assetTag: "AST-2026-001",
    name: "MacBook Pro 16\" M3 Max",
    category: "Laptop",
    serialNumber: "C02G1829MD6R",
    brandModel: "Apple MacBook Pro 16 (Space Black)",
    specs: "Apple M3 Max 14-Core CPU, 30-Core GPU, 36GB RAM, 1TB SSD, Liquid Retina XDR",
    location: "Head Office - Lt. 2 (IT & Engineering)",
    currentPic: "Budi Santoso",
    currentPicRole: "Lead Frontend Engineer",
    currentPicEmail: "budi.santoso@digitaltech.id",
    acquisitionDate: "2024-04-10",
    acquisitionValue: 49500000,
    condition: "Baik",
    status: "Aktif",
    warrantyExpiry: "2027-04-10",
    notes: "Diberikan untuk pengerjaan project UI/UX & Web Development utama.",
    createdAt: "2024-04-10T08:00:00Z",
    updatedAt: "2026-03-01T10:30:00Z",
    activeHandoverId: "hnd-001",
  },
  {
    id: "ast-002",
    assetTag: "AST-2026-002",
    name: "ThinkPad T14s Gen 4 AMD",
    category: "Laptop",
    serialNumber: "PF4992KL88",
    brandModel: "Lenovo ThinkPad T14s Gen 4",
    specs: "AMD Ryzen 7 PRO 7840U, 32GB LPDDR5x, 1TB NVMe, 14\" WUXGA Low Power",
    location: "Head Office - Lt. 2 (Backend Dev)",
    currentPic: "Siti Rahma",
    currentPicRole: "Senior Backend Developer",
    currentPicEmail: "siti.rahma@digitaltech.id",
    acquisitionDate: "2024-06-15",
    acquisitionValue: 24800000,
    condition: "Baik",
    status: "Aktif",
    warrantyExpiry: "2027-06-15",
    notes: "Laptop unit standar backend engineer.",
    createdAt: "2024-06-15T09:00:00Z",
    updatedAt: "2026-02-12T11:00:00Z",
  },
  {
    id: "ast-003",
    assetTag: "AST-2026-003",
    name: "Dell UltraSharp 27\" 4K USB-C Hub",
    category: "Monitor",
    serialNumber: "CN-0U2723QE-991",
    brandModel: "Dell U2723QE IPS Black",
    specs: "27-inch 4K UHD (3840 x 2160), 100% sRGB, IPS Black, 90W USB-C PD RJ45 Hub",
    location: "Studio Design - Lt. 1",
    currentPic: "Farhan Ardiansyah",
    currentPicRole: "UI/UX Designer",
    currentPicEmail: "farhan.design@digitaltech.id",
    acquisitionDate: "2024-08-01",
    acquisitionValue: 9800000,
    condition: "Baik",
    status: "Aktif",
    warrantyExpiry: "2027-08-01",
    notes: "Monitor kalibrasi warna untuk tim Creative & UI.",
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2026-01-20T14:00:00Z",
  },
  {
    id: "ast-004",
    assetTag: "AST-2026-004",
    name: "Dell PowerEdge R750 Server 2U",
    category: "Server",
    serialNumber: "SERV-R750-X902",
    brandModel: "Dell PowerEdge R750 Rack Server",
    specs: "2x Intel Xeon Gold 6330, 256GB ECC DDR4, 4x 3.84TB SAS SSD RAID 10, Redundant PSU",
    location: "Data Center Room - Lt. Basement",
    currentPic: "Ahmad Fauzi",
    currentPicRole: "Head of IT & Infrastructure",
    currentPicEmail: "ahmad.fauzi@digitaltech.id",
    acquisitionDate: "2023-11-20",
    acquisitionValue: 145000000,
    condition: "Baik",
    status: "Aktif",
    warrantyExpiry: "2028-11-20",
    notes: "Server on-premise untuk private database dan internal staging cluster.",
    createdAt: "2023-11-20T07:30:00Z",
    updatedAt: "2026-02-05T09:15:00Z",
  },
  {
    id: "ast-005",
    assetTag: "AST-2026-005",
    name: "Cisco Catalyst 9300 48-Port PoE+",
    category: "Networking",
    serialNumber: "FCW2438L0A1",
    brandModel: "Cisco C9300-48P-A",
    specs: "48 Ports Gigabit PoE+, 4x 10G SFP+ Uplinks, Network Advantage License",
    location: "Server Rack Lt. 2",
    currentPic: "Rian Pratama",
    currentPicRole: "Network Administrator",
    currentPicEmail: "rian.pratama@digitaltech.id",
    acquisitionDate: "2023-12-05",
    acquisitionValue: 62000000,
    condition: "Dalam Perbaikan",
    status: "Dalam Perbaikan",
    warrantyExpiry: "2026-12-05",
    notes: "Port 23-28 mengalami intermittent connection, sedang dalam diagnosa tim vendor Cisco.",
    createdAt: "2023-12-05T08:00:00Z",
    updatedAt: "2026-03-02T16:00:00Z",
  },
  {
    id: "ast-006",
    assetTag: "AST-2026-006",
    name: "HP EliteDesk 800 G6 Mini Desktop",
    category: "Desktop",
    serialNumber: "8CG1349K82",
    brandModel: "HP EliteDesk 800 G6 Desktop Mini",
    specs: "Intel Core i7-10700, 16GB RAM, 512GB NVMe SSD, WiFi 6 + BT",
    location: "IT Storage & Spare Room - Lt. 2",
    currentPic: "Ahmad Fauzi",
    currentPicRole: "Head of IT",
    currentPicEmail: "ahmad.fauzi@digitaltech.id",
    acquisitionDate: "2022-05-18",
    acquisitionValue: 16500000,
    condition: "Baik",
    status: "Tersedia",
    warrantyExpiry: "2025-05-18",
    notes: "Unit backup workstation siap deploy untuk karyawan baru.",
    createdAt: "2022-05-18T09:00:00Z",
    updatedAt: "2026-02-18T10:00:00Z",
  },
  {
    id: "ast-007",
    assetTag: "AST-2026-007",
    name: "MacBook Pro 13\" M1 2020",
    category: "Laptop",
    serialNumber: "C02DK829Q05D",
    brandModel: "Apple MacBook Pro 13 (Silver)",
    specs: "Apple M1 Chip 8-Core, 8GB Unified Memory, 256GB SSD",
    location: "Gudang Afkir & Scrap",
    currentPic: "Ahmad Fauzi",
    currentPicRole: "Head of IT",
    currentPicEmail: "ahmad.fauzi@digitaltech.id",
    acquisitionDate: "2021-01-10",
    acquisitionValue: 21500000,
    condition: "Rusak Berat",
    status: "Afkir",
    warrantyExpiry: "2022-01-10",
    notes: "Logic board mati total akibat water damage tahun 2023, sudah dihapus buku.",
    createdAt: "2021-01-10T10:00:00Z",
    updatedAt: "2025-12-01T15:00:00Z",
  },
  {
    id: "ast-008",
    assetTag: "AST-2026-008",
    name: "iPad Pro 11\" M2 Cellular 256GB",
    category: "Mobile Device",
    serialNumber: "DMPM2190KL82",
    brandModel: "Apple iPad Pro 11-inch 4th Gen",
    specs: "Apple M2 8-core CPU, 10-core GPU, 8GB RAM, 256GB, Wi-Fi + Cellular 5G",
    location: "Studio QA & Mobile Lab",
    currentPic: "Dewi Lestari",
    currentPicRole: "Lead QA Engineer",
    currentPicEmail: "dewi.lestari@digitaltech.id",
    acquisitionDate: "2024-02-28",
    acquisitionValue: 18900000,
    condition: "Baik",
    status: "Aktif",
    warrantyExpiry: "2025-02-28",
    notes: "Device testbed untuk pengujian aplikasi tablet dan mobile responsive.",
    createdAt: "2024-02-28T11:00:00Z",
    updatedAt: "2026-01-15T08:00:00Z",
  },
];

const INITIAL_AUDIT: AuditTrailEntry[] = [
  {
    id: "aud-001",
    assetId: "ast-001",
    timestamp: "2024-04-10T08:00:00Z",
    actionType: "REGISTRATION",
    actor: "Ahmad Fauzi",
    actorRole: "Head of IT",
    description: "Registrasi aset baru ke sistem inventaris.",
    notes: "Pembelian via PO-2024-0412 vendor iBox Indonesia.",
  },
  {
    id: "aud-002",
    assetId: "ast-001",
    timestamp: "2024-04-11T09:30:00Z",
    actionType: "HANDOVER",
    actor: "Ahmad Fauzi",
    actorRole: "Head of IT",
    fromPic: "IT Inventory Pool",
    toPic: "Budi Santoso",
    documentNumber: "BAST/IT/2024/04/011",
    description: "Serah terima unit kepada Lead Frontend Engineer.",
    notes: "Kondisi baru 100%, kelengkapan charger MagSafe 140W dan box.",
  },
  {
    id: "aud-003",
    assetId: "ast-001",
    timestamp: "2026-03-01T10:30:00Z",
    actionType: "HANDOVER",
    actor: "Ahmad Fauzi",
    actorRole: "Head of IT",
    fromPic: "Budi Santoso",
    toPic: "Hendra Wijaya",
    documentNumber: "BAST/IT/2026/03/001",
    description: "Inisiasi alur serah terima (transfer) aset ke PIC baru Hendra Wijaya.",
    notes: "Menunggu penyelesaian tanda tangan digital QR dari 3 pihak.",
  },
  {
    id: "aud-004",
    assetId: "ast-005",
    timestamp: "2026-03-02T16:00:00Z",
    actionType: "STATUS_CHANGE",
    actor: "Rian Pratama",
    actorRole: "Network Administrator",
    description: "Perubahan status aset menjadi 'Dalam Perbaikan'.",
    notes: "Klaim garansi switch Cisco via RMA portal.",
  },
];

const INITIAL_HANDOVERS: HandoverRecord[] = [
  {
    id: "hnd-001",
    assetId: "ast-001",
    assetTag: "AST-2026-001",
    assetName: "MacBook Pro 16\" M3 Max",
    documentNumber: "BAST/IT/2026/03/001",
    documentVersion: "v1.0",
    status: "pending_signatures",
    transferDate: "2026-03-09",
    reason: "Rotasi perangkat kerja ke Staff Engineering Baru",
    conditionAtTransfer: "Baik",
    locationAtTransfer: "Head Office - Lt. 2 (IT & Engineering)",
    notes: "Unit mulus, battery health 97%, charger dan sleeve lengkap.",
    createdAt: "2026-03-09T08:00:00Z",
    updatedAt: "2026-03-09T08:00:00Z",
    signers: [
      {
        id: "sig-001",
        name: "Ahmad Fauzi",
        role: "Penyerah (IT)",
        email: "ahmad.fauzi@digitaltech.id",
        token: "tok_sig_penyerah_01",
        status: "signed",
        signedAt: "2026-03-09T08:15:00Z",
        signatureCertificate: "CERT-SHA256-IT-98214",
        expiresAt: "2026-03-16T08:00:00Z",
      },
      {
        id: "sig-002",
        name: "Hendra Wijaya",
        role: "Penerima (PIC Baru)",
        email: "hendra.wijaya@digitaltech.id",
        token: "tok-valid-penerima",
        status: "pending",
        expiresAt: "2026-03-16T08:00:00Z",
      },
      {
        id: "sig-003",
        name: "Edy Hartono Nasrah",
        role: "Mengetahui (Atasan)",
        email: "edy.hartono@digitaltech.id",
        token: "tok-valid-atasan",
        status: "pending",
        expiresAt: "2026-03-16T08:00:00Z",
      },
    ],
  },
  // Simulation records for testing edge-case states
  {
    id: "hnd-expired",
    assetId: "ast-002",
    assetTag: "AST-2026-002",
    assetName: "ThinkPad T14s Gen 4 AMD",
    documentNumber: "BAST/IT/2026/02/089",
    documentVersion: "v1.0",
    status: "draft",
    transferDate: "2026-02-15",
    reason: "Pengalihan laptop staging",
    conditionAtTransfer: "Baik",
    locationAtTransfer: "Head Office - Lt. 2",
    notes: "Link tanda tangan telah kedaluwarsa.",
    createdAt: "2026-02-15T08:00:00Z",
    updatedAt: "2026-02-23T08:00:00Z",
    signers: [
      {
        id: "sig-exp-01",
        name: "Siti Rahma",
        role: "Penerima (PIC Baru)",
        email: "siti.rahma@digitaltech.id",
        token: "tok-expired",
        status: "expired",
        expiresAt: "2026-02-22T08:00:00Z", // Past date
      },
    ],
  },
  {
    id: "hnd-already-used",
    assetId: "ast-003",
    assetTag: "AST-2026-003",
    assetName: "Dell UltraSharp 27\" 4K",
    documentNumber: "BAST/IT/2026/01/014",
    documentVersion: "v1.0",
    status: "completed",
    transferDate: "2026-01-20",
    reason: "Penempatan monitor design studio",
    conditionAtTransfer: "Baik",
    locationAtTransfer: "Studio Design - Lt. 1",
    notes: "Tanda tangan telah berhasil diselesaikan.",
    createdAt: "2026-01-20T08:00:00Z",
    updatedAt: "2026-01-20T11:00:00Z",
    signers: [
      {
        id: "sig-used-01",
        name: "Farhan Ardiansyah",
        role: "Penerima (PIC Baru)",
        email: "farhan.design@digitaltech.id",
        token: "tok-already-used",
        status: "signed",
        signedAt: "2026-01-20T10:45:00Z",
        signatureCertificate: "CERT-SHA256-DSGN-5512",
        expiresAt: "2026-01-27T08:00:00Z",
      },
    ],
  },
  {
    id: "hnd-revoked",
    assetId: "ast-006",
    assetTag: "AST-2026-006",
    assetName: "HP EliteDesk 800 G6 Mini Desktop",
    documentNumber: "BAST/IT/2026/02/099",
    documentVersion: "v1.0",
    status: "revoked",
    transferDate: "2026-02-25",
    reason: "Dibatalkan karena divisi penerima beralih ke laptop mobile",
    conditionAtTransfer: "Baik",
    locationAtTransfer: "IT Storage & Spare Room",
    notes: "Sesi ditarik kembali oleh Head of IT.",
    createdAt: "2026-02-25T08:00:00Z",
    updatedAt: "2026-02-26T09:00:00Z",
    revokedAt: "2026-02-26T09:00:00Z",
    revokedReason: "Dibatalkan oleh Admin IT: User meminta perubahan tipe unit dari Desktop ke Laptop.",
    signers: [
      {
        id: "sig-rev-01",
        name: "Bambang Sugeng",
        role: "Penerima (PIC Baru)",
        email: "bambang.sugeng@digitaltech.id",
        token: "tok-revoked",
        status: "revoked",
        expiresAt: "2026-03-05T08:00:00Z",
      },
    ],
  },
  {
    id: "hnd-superseded",
    assetId: "ast-008",
    assetTag: "AST-2026-008",
    assetName: "iPad Pro 11\" M2 Cellular",
    documentNumber: "BAST/IT/2026/02/033",
    documentVersion: "v1.0 (Superseded)",
    status: "superseded",
    transferDate: "2026-02-20",
    reason: "Perubahan spesifikasi aksesoris",
    conditionAtTransfer: "Baik",
    locationAtTransfer: "Studio QA & Mobile Lab",
    notes: "Dokumen versi v1.0 dibatalkan dan digantikan oleh revisi v2.0 dengan penambahan Apple Pencil 2.",
    createdAt: "2026-02-20T08:00:00Z",
    updatedAt: "2026-02-21T10:00:00Z",
    supersededBy: "BAST/IT/2026/02/033-v2",
    signers: [
      {
        id: "sig-sup-01",
        name: "Dewi Lestari",
        role: "Penerima (PIC Baru)",
        email: "dewi.lestari@digitaltech.id",
        token: "tok-superseded",
        status: "superseded",
        expiresAt: "2026-02-27T08:00:00Z",
      },
    ],
  },
];

// In-memory singletons for SSR & fallback
let memoryAssets = [...INITIAL_ASSETS];
let memoryAudit = [...INITIAL_AUDIT];
let memoryHandovers = [...INITIAL_HANDOVERS];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("Error saving to localStorage:", err);
  }
}

export function getStoredAssets(): Asset[] {
  if (!isBrowser()) return memoryAssets;
  const stored = loadFromStorage<Asset[]>(STORAGE_KEY_ASSETS, memoryAssets);
  memoryAssets = stored;
  return stored;
}

export function getStoredAudit(): AuditTrailEntry[] {
  if (!isBrowser()) return memoryAudit;
  const stored = loadFromStorage<AuditTrailEntry[]>(STORAGE_KEY_AUDIT, memoryAudit);
  memoryAudit = stored;
  return stored;
}

export function getStoredHandovers(): HandoverRecord[] {
  if (!isBrowser()) return memoryHandovers;
  const stored = loadFromStorage<HandoverRecord[]>(STORAGE_KEY_HANDOVERS, memoryHandovers);
  memoryHandovers = stored;
  return stored;
}

export function getAssetMetrics(): AssetMetrics {
  const assets = getStoredAssets();
  const handovers = getStoredHandovers();

  const total = assets.length;
  const active = assets.filter((a) => a.status === "Aktif").length;
  const inRepair = assets.filter((a) => a.status === "Dalam Perbaikan").length;
  const retiredOrAvailable = assets.filter(
    (a) => a.status === "Afkir" || a.status === "Tersedia"
  ).length;
  const pendingSignature = handovers.filter(
    (h) => h.status === "pending_signatures"
  ).length;

  return {
    total,
    active,
    inRepair,
    retiredOrAvailable,
    pendingSignature,
  };
}

export function getAssetById(id: string): Asset | undefined {
  const assets = getStoredAssets();
  return assets.find((a) => a.id === id);
}

export function getAuditTrailByAssetId(assetId: string): AuditTrailEntry[] {
  const audits = getStoredAudit();
  return audits
    .filter((entry) => entry.assetId === assetId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getHandoverByAssetId(assetId: string): HandoverRecord | undefined {
  const handovers = getStoredHandovers();
  return handovers.find((h) => h.assetId === assetId && h.status === "pending_signatures") ||
    handovers.find((h) => h.assetId === assetId);
}

export function getHandoverByToken(token: string): {
  handover?: HandoverRecord;
  signer?: SignerInfo;
  asset?: Asset;
  isTokenExpired?: boolean;
} {
  const handovers = getStoredHandovers();
  for (const h of handovers) {
    const signer = h.signers.find((s) => s.token === token);
    if (signer) {
      const asset = getAssetById(h.assetId);
      const isTokenExpired =
        signer.status === "expired" ||
        new Date(signer.expiresAt).getTime() < Date.now();
      return { handover: h, signer, asset, isTokenExpired };
    }
  }
  return {};
}

export function createAsset(values: AssetFormValues, actorName = "Admin"): Asset {
  const assets = getStoredAssets();
  const audits = getStoredAudit();

  const id = `ast-${Date.now()}`;
  const now = new Date().toISOString();

  const seq = String(assets.length + 1).padStart(3, "0");
  const autoTag = `AST-${new Date().getFullYear()}-${seq}`;

  const newAsset: Asset = {
    id,
    assetTag: values.assetTag && values.assetTag.trim() !== "" ? values.assetTag : autoTag,
    name: values.name,
    category: values.category,
    serialNumber: values.serialNumber,
    brandModel: values.brandModel,
    specs: values.specs,
    location: values.location,
    currentPic: values.currentPic,
    currentPicRole: values.currentPicRole,
    currentPicEmail: values.currentPicEmail,
    acquisitionDate: values.acquisitionDate,
    acquisitionValue: Number(values.acquisitionValue),
    condition: values.condition,
    status: values.status,
    warrantyExpiry: values.warrantyExpiry,
    notes: values.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  const newAudit: AuditTrailEntry = {
    id: `aud-${Date.now()}`,
    assetId: id,
    timestamp: now,
    actionType: "REGISTRATION",
    actor: actorName,
    actorRole: "IT Asset Manager",
    description: `Pendaftaran aset baru: ${newAsset.name} (${newAsset.assetTag})`,
    notes: newAsset.notes,
  };

  const updatedAssets = [newAsset, ...assets];
  const updatedAudits = [newAudit, ...audits];

  memoryAssets = updatedAssets;
  memoryAudit = updatedAudits;

  saveToStorage(STORAGE_KEY_ASSETS, updatedAssets);
  saveToStorage(STORAGE_KEY_AUDIT, updatedAudits);

  return newAsset;
}

export function updateAsset(
  id: string,
  values: Partial<AssetFormValues>,
  actorName = "Admin"
): Asset {
  const assets = getStoredAssets();
  const audits = getStoredAudit();

  const existingIndex = assets.findIndex((a) => a.id === id);
  if (existingIndex === -1) {
    throw new Error("Aset tidak ditemukan");
  }

  const existing = assets[existingIndex];
  const now = new Date().toISOString();

  const updated: Asset = {
    ...existing,
    ...values,
    acquisitionValue:
      values.acquisitionValue !== undefined
        ? Number(values.acquisitionValue)
        : existing.acquisitionValue,
    updatedAt: now,
  };

  const statusChanged = values.status && values.status !== existing.status;
  const conditionChanged = values.condition && values.condition !== existing.condition;

  const newAudit: AuditTrailEntry = {
    id: `aud-${Date.now()}`,
    assetId: id,
    timestamp: now,
    actionType: statusChanged ? "STATUS_CHANGE" : "MAINTENANCE",
    actor: actorName,
    actorRole: "IT Asset Manager",
    description: `Pembaruan data aset ${updated.assetTag}${
      statusChanged ? ` - Status: ${existing.status} -> ${updated.status}` : ""
    }${conditionChanged ? ` - Kondisi: ${existing.condition} -> ${updated.condition}` : ""}`,
    notes: values.notes || existing.notes,
  };

  const updatedAssets = [...assets];
  updatedAssets[existingIndex] = updated;
  const updatedAudits = [newAudit, ...audits];

  memoryAssets = updatedAssets;
  memoryAudit = updatedAudits;

  saveToStorage(STORAGE_KEY_ASSETS, updatedAssets);
  saveToStorage(STORAGE_KEY_AUDIT, updatedAudits);

  return updated;
}

export function deleteOrRetireAsset(
  id: string,
  reason: string,
  actorName = "Admin"
): Asset {
  return updateAsset(
    id,
    {
      status: "Afkir",
      condition: "Rusak Berat",
      notes: `Aset diafkirkan: ${reason}`,
    },
    actorName
  );
}

export function createHandover(
  assetId: string,
  values: HandoverFormValues,
  actorName = "Admin"
): HandoverRecord {
  const assets = getStoredAssets();
  const audits = getStoredAudit();
  const handovers = getStoredHandovers();

  const asset = assets.find((a) => a.id === assetId);
  if (!asset) throw new Error("Aset tidak ditemukan");

  const handoverId = `hnd-${Date.now()}`;
  const now = new Date().toISOString();
  const docSeq = handovers.length + 1;
  const docNumber = `BAST/IT/${new Date().getFullYear()}/${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}/${String(docSeq).padStart(3, "0")}`;

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 7);
  const expiresAt = expiresDate.toISOString();

  // Generate secure opaque tokens (never contains PII or serial numbers)
  const penyerahToken = `tok_sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const penerimaToken = `tok_sig_${Date.now() + 1}_${Math.random().toString(36).substring(2, 9)}`;
  const atasanToken = `tok_sig_${Date.now() + 2}_${Math.random().toString(36).substring(2, 9)}`;

  const signers: SignerInfo[] = [
    {
      id: `sig-${Date.now()}-1`,
      name: values.signerItName,
      role: "Penyerah (IT)",
      email: values.signerItEmail,
      token: penyerahToken,
      status: "signed", // IT who initiates is considered pre-signed or signs immediately
      signedAt: now,
      signatureCertificate: `CERT-SHA256-IT-${Math.floor(10000 + Math.random() * 90000)}`,
      expiresAt,
    },
    {
      id: `sig-${Date.now()}-2`,
      name: values.newPic,
      role: "Penerima (PIC Baru)",
      email: values.newPicEmail,
      token: penerimaToken,
      status: "pending",
      expiresAt,
    },
    {
      id: `sig-${Date.now()}-3`,
      name: values.signerSupervisorName,
      role: "Mengetahui (Atasan)",
      email: values.signerSupervisorEmail,
      token: atasanToken,
      status: "pending",
      expiresAt,
    },
  ];

  const newHandover: HandoverRecord = {
    id: handoverId,
    assetId: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.name,
    documentNumber: docNumber,
    documentVersion: "v1.0",
    status: "pending_signatures",
    transferDate: values.transferDate,
    reason: values.reason,
    conditionAtTransfer: values.condition,
    locationAtTransfer: values.location,
    notes: values.notes || "",
    signers,
    createdAt: now,
    updatedAt: now,
  };

  // Add audit trail entry
  const newAudit: AuditTrailEntry = {
    id: `aud-${Date.now()}`,
    assetId: asset.id,
    timestamp: now,
    actionType: "HANDOVER",
    actor: actorName,
    actorRole: "IT Asset Admin",
    description: `Inisiasi Berita Acara Serah Terima (${docNumber}) kepada ${values.newPic}`,
    fromPic: asset.currentPic,
    toPic: values.newPic,
    documentNumber: docNumber,
    notes: values.reason,
  };

  // Update asset with activeHandoverId
  const updatedAssets = assets.map((a) =>
    a.id === assetId ? { ...a, activeHandoverId: handoverId } : a
  );
  const updatedAudits = [newAudit, ...audits];
  const updatedHandovers = [newHandover, ...handovers];

  memoryAssets = updatedAssets;
  memoryAudit = updatedAudits;
  memoryHandovers = updatedHandovers;

  saveToStorage(STORAGE_KEY_ASSETS, updatedAssets);
  saveToStorage(STORAGE_KEY_AUDIT, updatedAudits);
  saveToStorage(STORAGE_KEY_HANDOVERS, updatedHandovers);

  return newHandover;
}

export function signHandoverByToken(
  token: string,
  signerName: string
): { success: boolean; message: string; handover?: HandoverRecord } {
  const handovers = getStoredHandovers();
  const assets = getStoredAssets();
  const audits = getStoredAudit();

  let targetHandoverIndex = -1;
  let targetSignerIndex = -1;

  for (let i = 0; i < handovers.length; i++) {
    const sIndex = handovers[i].signers.findIndex((s) => s.token === token);
    if (sIndex !== -1) {
      targetHandoverIndex = i;
      targetSignerIndex = sIndex;
      break;
    }
  }

  if (targetHandoverIndex === -1 || targetSignerIndex === -1) {
    return { success: false, message: "Token tanda tangan tidak valid atau tidak ditemukan." };
  }

  const handover = handovers[targetHandoverIndex];
  const signer = handover.signers[targetSignerIndex];

  if (handover.status === "revoked") {
    return { success: false, message: "Sesi serah terima ini telah dibatalkan oleh IT." };
  }

  if (handover.status === "superseded") {
    return { success: false, message: "Dokumen ini telah digantikan oleh versi yang lebih baru." };
  }

  if (signer.status === "signed") {
    return { success: false, message: "Tanda tangan digital untuk akun Anda telah selesai sebelumnya." };
  }

  if (signer.status === "declined") {
    return { success: false, message: "Permintaan serah terima ini telah ditolak sebelumnya." };
  }

  const isExpired =
    signer.status === "expired" ||
    new Date(signer.expiresAt).getTime() < Date.now();
  if (isExpired) {
    return { success: false, message: "Link tanda tangan digital telah kedaluwarsa." };
  }

  const now = new Date().toISOString();
  const certCode = `CERT-SHA256-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const updatedSigners = [...handover.signers];
  updatedSigners[targetSignerIndex] = {
    ...signer,
    status: "signed",
    signedAt: now,
    signatureCertificate: certCode,
  };

  const allSigned = updatedSigners.every((s) => s.status === "signed");
  const updatedStatus = allSigned ? "completed" : "pending_signatures";

  const updatedHandover: HandoverRecord = {
    ...handover,
    signers: updatedSigners,
    status: updatedStatus,
    updatedAt: now,
  };

  handovers[targetHandoverIndex] = updatedHandover;

  // If all signed, update the asset PIC and location permanently
  let updatedAssets = assets;
  if (allSigned) {
    const penerima = updatedSigners.find((s) => s.role === "Penerima (PIC Baru)");
    if (penerima) {
      updatedAssets = assets.map((a) => {
        if (a.id === handover.assetId) {
          return {
            ...a,
            currentPic: penerima.name,
            currentPicEmail: penerima.email,
            location: handover.locationAtTransfer,
            condition: handover.conditionAtTransfer,
            activeHandoverId: undefined,
            updatedAt: now,
          };
        }
        return a;
      });
    }

    const auditEntry: AuditTrailEntry = {
      id: `aud-${Date.now()}`,
      assetId: handover.assetId,
      timestamp: now,
      actionType: "SIGNATURE_COMPLETED",
      actor: signerName,
      actorRole: signer.role,
      description: `Seluruh pihak telah menandatangani ${handover.documentNumber}. Serah terima aset resmi selesai.`,
      documentNumber: handover.documentNumber,
    };
    audits.unshift(auditEntry);
  } else {
    const auditEntry: AuditTrailEntry = {
      id: `aud-${Date.now()}`,
      assetId: handover.assetId,
      timestamp: now,
      actionType: "SIGNATURE_COMPLETED",
      actor: signerName,
      actorRole: signer.role,
      description: `Tanda tangan digital diverifikasi dari ${signer.name} (${signer.role}).`,
      documentNumber: handover.documentNumber,
    };
    audits.unshift(auditEntry);
  }

  memoryAssets = updatedAssets;
  memoryAudit = audits;
  memoryHandovers = handovers;

  saveToStorage(STORAGE_KEY_ASSETS, updatedAssets);
  saveToStorage(STORAGE_KEY_AUDIT, audits);
  saveToStorage(STORAGE_KEY_HANDOVERS, handovers);

  return {
    success: true,
    message: "Tanda tangan digital berhasil diverifikasi dan disimpan.",
    handover: updatedHandover,
  };
}

export function declineHandoverByToken(
  token: string,
  reason: string
): { success: boolean; message: string; handover?: HandoverRecord } {
  const handovers = getStoredHandovers();
  const audits = getStoredAudit();

  let targetHandoverIndex = -1;
  let targetSignerIndex = -1;

  for (let i = 0; i < handovers.length; i++) {
    const sIndex = handovers[i].signers.findIndex((s) => s.token === token);
    if (sIndex !== -1) {
      targetHandoverIndex = i;
      targetSignerIndex = sIndex;
      break;
    }
  }

  if (targetHandoverIndex === -1 || targetSignerIndex === -1) {
    return { success: false, message: "Token tanda tangan tidak ditemukan." };
  }

  const handover = handovers[targetHandoverIndex];
  const signer = handover.signers[targetSignerIndex];
  const now = new Date().toISOString();

  const updatedSigners = [...handover.signers];
  updatedSigners[targetSignerIndex] = {
    ...signer,
    status: "declined",
    declinedAt: now,
    declineReason: reason,
  };

  const updatedHandover: HandoverRecord = {
    ...handover,
    signers: updatedSigners,
    status: "declined",
    updatedAt: now,
  };

  handovers[targetHandoverIndex] = updatedHandover;

  const auditEntry: AuditTrailEntry = {
    id: `aud-${Date.now()}`,
    assetId: handover.assetId,
    timestamp: now,
    actionType: "SIGNATURE_REVOKED",
    actor: signer.name,
    actorRole: signer.role,
    description: `Serah terima ditolak oleh ${signer.name}: "${reason}"`,
    documentNumber: handover.documentNumber,
    notes: reason,
  };
  audits.unshift(auditEntry);

  memoryAudit = audits;
  memoryHandovers = handovers;

  saveToStorage(STORAGE_KEY_AUDIT, audits);
  saveToStorage(STORAGE_KEY_HANDOVERS, handovers);

  return {
    success: true,
    message: "Serah terima telah ditolak dan dicatat pada audit trail.",
    handover: updatedHandover,
  };
}

export function revokeHandoverSession(
  handoverId: string,
  reason: string,
  actorName = "Admin IT"
): { success: boolean; message: string; handover?: HandoverRecord } {
  const handovers = getStoredHandovers();
  const assets = getStoredAssets();
  const audits = getStoredAudit();

  const hIndex = handovers.findIndex((h) => h.id === handoverId);
  if (hIndex === -1) {
    return { success: false, message: "Data serah terima tidak ditemukan." };
  }

  const now = new Date().toISOString();
  const handover = handovers[hIndex];

  const updatedSigners = handover.signers.map((s) => ({
    ...s,
    status: s.status === "signed" ? s.status : ("revoked" as const),
  }));

  const updatedHandover: HandoverRecord = {
    ...handover,
    signers: updatedSigners,
    status: "revoked",
    revokedAt: now,
    revokedReason: reason,
    updatedAt: now,
  };

  handovers[hIndex] = updatedHandover;

  // Clear activeHandoverId from asset
  const updatedAssets = assets.map((a) =>
    a.id === handover.assetId ? { ...a, activeHandoverId: undefined } : a
  );

  const auditEntry: AuditTrailEntry = {
    id: `aud-${Date.now()}`,
    assetId: handover.assetId,
    timestamp: now,
    actionType: "SIGNATURE_REVOKED",
    actor: actorName,
    actorRole: "IT Administrator",
    description: `Sesi serah terima ${handover.documentNumber} dicabut (revoked): ${reason}`,
    documentNumber: handover.documentNumber,
    notes: reason,
  };
  audits.unshift(auditEntry);

  memoryAssets = updatedAssets;
  memoryAudit = audits;
  memoryHandovers = handovers;

  saveToStorage(STORAGE_KEY_ASSETS, updatedAssets);
  saveToStorage(STORAGE_KEY_AUDIT, audits);
  saveToStorage(STORAGE_KEY_HANDOVERS, handovers);

  return {
    success: true,
    message: `Sesi serah terima ${handover.documentNumber} berhasil dicabut.`,
    handover: updatedHandover,
  };
}

export function resendSignerNotification(
  handoverId: string,
  signerId: string
): { success: boolean; message: string } {
  const handovers = getStoredHandovers();
  const handover = handovers.find((h) => h.id === handoverId);
  if (!handover) return { success: false, message: "Handover tidak ditemukan" };

  const signer = handover.signers.find((s) => s.id === signerId);
  if (!signer) return { success: false, message: "Signer tidak ditemukan" };

  return {
    success: true,
    message: `Notifikasi dan link tanda tangan digital berhasil dikirim ulang ke ${signer.name} (${signer.email}).`,
  };
}

export function resetAllAssetData(): void {
  if (isBrowser()) {
    window.localStorage.removeItem(STORAGE_KEY_ASSETS);
    window.localStorage.removeItem(STORAGE_KEY_AUDIT);
    window.localStorage.removeItem(STORAGE_KEY_HANDOVERS);
  }
  memoryAssets = [...INITIAL_ASSETS];
  memoryAudit = [...INITIAL_AUDIT];
  memoryHandovers = [...INITIAL_HANDOVERS];
}
