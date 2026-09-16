import { z } from "zod";

export const assetCategories = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Server",
  "Networking",
  "Peripheral",
  "Mobile Device",
  "Lainnya",
] as const;

export const assetStatuses = [
  "Aktif",
  "Dalam Perbaikan",
  "Tersedia",
  "Afkir",
] as const;

export const assetConditions = [
  "Baik",
  "Rusak Ringan",
  "Dalam Perbaikan",
  "Rusak Berat",
] as const;

export const assetFormSchema = z.object({
  assetTag: z
    .string()
    .optional()
    .default(""),
  name: z.string().min(3, "Nama aset minimal 3 karakter"),
  category: z.enum(assetCategories, {
    message: "Pilih kategori aset yang valid",
  }),
  serialNumber: z.string().min(3, "Nomor seri (Serial Number) wajib diisi"),
  brandModel: z.string().min(2, "Merk / Model wajib diisi"),
  specs: z.string().min(5, "Spesifikasi minimal 5 karakter"),
  location: z.string().min(2, "Lokasi penempatan aset wajib diisi"),
  currentPic: z.string().optional().default(""),
  currentPicRole: z.string().optional().default(""),
  currentPicEmail: z.string().optional().default(""),
  acquisitionDate: z.string().min(1, "Tanggal perolehan wajib dipilih"),
  acquisitionValue: z.coerce
    .number()
    .min(0, "Nilai perolehan tidak boleh negatif"),
  condition: z.enum(assetConditions, {
    message: "Pilih kondisi aset yang valid",
  }),
  status: z.enum(assetStatuses, {
    message: "Pilih status aset yang valid",
  }),
  warrantyExpiry: z.string().min(1, "Tanggal garansi wajib dipilih"),
  notes: z.string().optional().default(""),
});

export const assetRegistrationSchema = assetFormSchema;

export type AssetFormValues = z.infer<typeof assetFormSchema>;

export const handoverFormSchema = z.object({
  newPic: z.string().min(2, "Nama PIC baru penerima wajib diisi"),
  newPicRole: z.string().min(2, "Jabatan PIC baru wajib diisi"),
  newPicEmail: z.string().email("Email PIC baru tidak valid"),
  transferDate: z.string().min(1, "Tanggal serah terima wajib dipilih"),
  reason: z.string().min(5, "Alasan serah terima minimal 5 karakter"),
  condition: z.enum(assetConditions, {
    message: "Pilih kondisi aset saat ini",
  }),
  location: z.string().min(2, "Lokasi baru penempatan aset wajib diisi"),
  notes: z.string().optional().default(""),
  // Multi-signer details
  signerItName: z.string().min(2, "Nama penyerah (IT) wajib diisi"),
  signerItEmail: z.string().email("Email penyerah (IT) tidak valid"),
  signerSupervisorName: z.string().min(2, "Nama atasan/mengetahui wajib diisi"),
  signerSupervisorEmail: z.string().email("Email atasan tidak valid"),
});

export const assetHandoverSchema = handoverFormSchema;

export type HandoverFormValues = z.infer<typeof handoverFormSchema>;

export const declineSchema = z.object({
  reason: z.string().min(10, "Alasan penolakan minimal 10 karakter agar dapat ditinjau oleh IT"),
});

export type DeclineFormValues = z.infer<typeof declineSchema>;
