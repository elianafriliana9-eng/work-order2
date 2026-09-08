import { z } from 'zod';

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
export type SuratDocumentType = 'handover' | 'return';
export type SuratStatus = 'draft' | 'awaiting_recipient_signature' | 'completed' | 'cancelled';

export interface Asset {
    id: string;
    code: string;
    name: string;
    category: string;
    serial_number: string | null;
    asset_value: number;
    status: AssetStatus;
    current_holder_id: string | null;
    acquired_at: string | null;
    notes: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    created_at: string;
    updated_at: string;
    current_holder?: {
        id: string;
        full_name: string | null;
        division: string | null;
    } | null;
}

export interface SuratSerahTerimaItem {
    id: string;
    surat_id: string;
    asset_id: string;
    asset_code: string;
    asset_name: string;
    asset_category: string;
    asset_serial_number: string | null;
    asset_value: number;
    handover_condition: string;
    return_condition: string | null;
    notes: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface SuratSerahTerima {
    id: string;
    work_order_id: string;
    document_number: string;
    document_type: SuratDocumentType;
    document_date: string;
    giver_id: string;
    receiver_id: string;
    hrd_id: string | null;
    giver_name: string;
    giver_department: string;
    receiver_name: string;
    receiver_department: string;
    hrd_name: string | null;
    notes: string | null;
    status: SuratStatus;
    giver_signature_path: string | null;
    receiver_signature_path: string | null;
    hrd_signature_path: string | null;
    giver_signed_at: string | null;
    receiver_signed_at: string | null;
    hrd_signed_at: string | null;
    pdf_path: string | null;
    finalized_at: string | null;
    cancelled_at: string | null;
    version: number;
    created_by: string;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    items?: SuratSerahTerimaItem[];
}

const uuidSchema = z.string().regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i,
    'ID harus berupa format UUID valid'
);

export const createAssetSchema = z.object({
    code: z.string().trim().min(1, 'Kode aset tidak boleh kosong').optional(),
    name: z.string().trim().min(1, 'Nama aset wajib diisi'),
    category: z.string().trim().min(1, 'Kategori aset wajib diisi'),
    serial_number: z.string().trim().nullable().optional(),
    asset_value: z.number().nonnegative('Nilai aset tidak boleh negatif').default(0),
    status: z.enum(['available', 'in_use', 'maintenance', 'retired']).default('available'),
    current_holder_id: uuidSchema.nullable().optional(),
    acquired_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').nullable().optional(),
    notes: z.string().trim().nullable().optional(),
}).refine(data => {
    if (data.status === 'in_use' && !data.current_holder_id) {
        return false;
    }
    return true;
}, {
    message: 'Aset dengan status in_use wajib memiliki pemegang (current_holder_id)',
    path: ['current_holder_id'],
});

export const updateAssetSchema = z.object({
    code: z.string().trim().min(1, 'Kode aset tidak boleh kosong').optional(),
    name: z.string().trim().min(1, 'Nama aset tidak boleh kosong').optional(),
    category: z.string().trim().min(1, 'Kategori aset tidak boleh kosong').optional(),
    serial_number: z.string().trim().nullable().optional(),
    asset_value: z.number().nonnegative('Nilai aset tidak boleh negatif').optional(),
    status: z.enum(['available', 'in_use', 'maintenance', 'retired']).optional(),
    current_holder_id: uuidSchema.nullable().optional(),
    acquired_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').nullable().optional(),
    notes: z.string().trim().nullable().optional(),
}).refine(data => {
    if (data.status === 'in_use' && data.current_holder_id === null) {
        return false;
    }
    return true;
}, {
    message: 'Aset dengan status in_use wajib memiliki pemegang (current_holder_id)',
    path: ['current_holder_id'],
});

export const createSuratSchema = z.object({
    work_order_id: uuidSchema,
    document_type: z.enum(['handover', 'return', 'penyerahan', 'pengembalian']).transform(val => {
        if (val === 'penyerahan') return 'handover';
        if (val === 'pengembalian') return 'return';
        return val as SuratDocumentType;
    }),
    giver_id: uuidSchema,
    receiver_id: uuidSchema,
    giver_name: z.string().trim().min(1, 'Nama penyerah wajib diisi'),
    giver_department: z.string().trim().min(1, 'Departemen penyerah wajib diisi'),
    receiver_name: z.string().trim().min(1, 'Nama penerima wajib diisi'),
    receiver_department: z.string().trim().min(1, 'Departemen penerima wajib diisi'),
    hrd_id: uuidSchema.nullable().optional(),
    hrd_name: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
    asset_ids: z.array(uuidSchema).min(1, 'Pilih minimal satu aset'),
    handover_condition: z.string().trim().default('baik'),
});

export const signSuratSchema = z.object({
    role: z.enum(['giver', 'receiver', 'hrd']).optional(),
    signature: z.string().min(10, 'Data tanda tangan wajib diisi'),
    signer_name: z.string().trim().optional(),
});
