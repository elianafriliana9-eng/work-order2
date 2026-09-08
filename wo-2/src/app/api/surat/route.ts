import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthUser,
    createAdminClient,
    unauthorizedResponse,
    forbiddenResponse,
    badRequestResponse,
    serverErrorResponse,
} from '@/lib/server-auth';
import { createSuratSchema, type SuratSerahTerima } from '@/types/assets';
import { generateNextDocumentNumber } from '@/lib/surat-number';

/**
 * GET /api/surat
 * Ambil riwayat surat serah terima
 * Akses: Admin melihat seluruh riwayat, User biasa hanya melihat miliknya
 */
export async function GET(request: NextRequest) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const docType = searchParams.get('type') || searchParams.get('document_type');
        const workOrderId = searchParams.get('work_order_id');
        const search = searchParams.get('search') || searchParams.get('q');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const offset = (page - 1) * limit;

        const supabase = createAdminClient();
        let query = supabase
            .from('surat_serah_terima')
            .select(`
                *,
                items:surat_serah_terima_items(*)
            `, { count: 'exact' });

        // Non-admin can only see documents where they are participant or creator
        if (!isAdmin) {
            query = query.or(`giver_id.eq.${user.id},receiver_id.eq.${user.id},hrd_id.eq.${user.id},created_by.eq.${user.id}`);
        }

        // Apply filters
        if (status) {
            if (status.includes(',')) {
                const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
                query = query.in('status', statuses);
            } else {
                query = query.eq('status', status.trim());
            }
        }

        if (docType) {
            const mappedType = docType === 'penyerahan' ? 'handover' : (docType === 'pengembalian' ? 'return' : docType);
            query = query.eq('document_type', mappedType);
        }

        if (workOrderId) {
            query = query.eq('work_order_id', workOrderId);
        }

        if (search) {
            const term = search.trim();
            query = query.or(`document_number.ilike.%${term}%,giver_name.ilike.%${term}%,receiver_name.ilike.%${term}%,notes.ilike.%${term}%`);
        }

        query = query.order('document_date', { ascending: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (error) {
            return serverErrorResponse('Gagal mengambil riwayat surat serah terima', error);
        }

        return NextResponse.json({
            surat: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat memproses data surat', err);
    }
}

/**
 * POST /api/surat
 * Pembuatan surat serah terima baru dengan penomoran otomatis format standar PT SRT
 * Proteksi anti-duplikat dan race-condition
 * Akses: Khusus Admin / Head IT
 */
export async function POST(request: NextRequest) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }
        if (!isAdmin) {
            return forbiddenResponse('Hanya Administrator atau Head IT yang berhak menerbitkan surat serah terima');
        }

        const body = await request.json();
        const validation = createSuratSchema.safeParse(body);
        if (!validation.success) {
            return badRequestResponse('Data pembuatan surat tidak valid', validation.error.issues);
        }

        const payload = validation.data;
        const supabase = createAdminClient();

        // 1. Validasi keberadaan aset dan kesesuaian status
        const { data: assetRecords, error: assetFetchErr } = await supabase
            .from('assets')
            .select('*')
            .in('id', payload.asset_ids);

        if (assetFetchErr) {
            return serverErrorResponse('Gagal memverifikasi data aset', assetFetchErr);
        }

        if (!assetRecords || assetRecords.length !== payload.asset_ids.length) {
            return badRequestResponse('Satu atau lebih ID aset yang dipilih tidak ditemukan dalam katalog');
        }

        // Cek ketersediaan aset berdasarkan jenis dokumen
        for (const asset of assetRecords) {
            if (payload.document_type === 'handover') {
                if (asset.status !== 'available') {
                    return badRequestResponse(
                        `Aset '${asset.name}' (${asset.code}) sedang berstatus '${asset.status}' dan tidak tersedia untuk diserahterimakan`
                    );
                }
            } else if (payload.document_type === 'return') {
                if (asset.status !== 'in_use' || asset.current_holder_id !== payload.giver_id) {
                    return badRequestResponse(
                        `Aset '${asset.name}' (${asset.code}) tidak tercatat sedang dipegang oleh pihak pengembali (${payload.giver_name})`
                    );
                }
            }
        }

        // 2. Pembuatan surat dengan proteksi race-condition anti-duplikat
        const maxRetries = 3;
        let createdSurat: SuratSerahTerima | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const documentNumber = await generateNextDocumentNumber(supabase);

            // Attempt RPC creation first if defined in migration
            const { data: rpcSurat, error: rpcErr } = await supabase.rpc('create_surat_draft', {
                p_work_order_id: payload.work_order_id,
                p_document_type: payload.document_type,
                p_giver_id: payload.giver_id,
                p_receiver_id: payload.receiver_id,
                p_giver_name: payload.giver_name,
                p_giver_department: payload.giver_department,
                p_receiver_name: payload.receiver_name,
                p_receiver_department: payload.receiver_department,
                p_asset_ids: payload.asset_ids,
                p_notes: payload.notes || null,
                p_hrd_id: payload.hrd_id || null,
                p_hrd_name: payload.hrd_name || null,
            });

            if (!rpcErr && rpcSurat) {
                // Fetch full surat with items
                const { data: fullSurat } = await supabase
                    .from('surat_serah_terima')
                    .select('*, items:surat_serah_terima_items(*)')
                    .eq('id', rpcSurat.id)
                    .single();

                createdSurat = fullSurat || rpcSurat;
                break;
            }

            // Fallback direct creation with anti-collision handling
            const { data: surat, error: insertError } = await supabase
                .from('surat_serah_terima')
                .insert({
                    work_order_id: payload.work_order_id,
                    document_number: documentNumber,
                    document_type: payload.document_type,
                    document_date: new Date().toISOString().split('T')[0],
                    giver_id: payload.giver_id,
                    receiver_id: payload.receiver_id,
                    hrd_id: payload.hrd_id || null,
                    giver_name: payload.giver_name,
                    giver_department: payload.giver_department,
                    receiver_name: payload.receiver_name,
                    receiver_department: payload.receiver_department,
                    hrd_name: payload.hrd_name || null,
                    notes: payload.notes || null,
                    status: 'draft',
                    created_by: user.id,
                })
                .select()
                .single();

            if (insertError) {
                // Check if collision on document_number
                if (insertError.code === '23505' && attempt < maxRetries) {
                    continue; // Retry with next sequence
                }
                return serverErrorResponse('Gagal membuat dokumen surat serah terima', insertError);
            }

            // Insert snapshot items
            const itemsPayload = assetRecords.map(asset => ({
                surat_id: surat.id,
                asset_id: asset.id,
                asset_code: asset.code,
                asset_name: asset.name,
                asset_category: asset.category,
                asset_serial_number: asset.serial_number || null,
                asset_value: asset.asset_value || 0,
                handover_condition: payload.handover_condition || 'baik',
                created_by: user.id,
            }));

            const { data: insertedItems, error: itemsError } = await supabase
                .from('surat_serah_terima_items')
                .insert(itemsPayload)
                .select();

            if (itemsError) {
                // Rollback surat if item insertion failed
                await supabase.from('surat_serah_terima').delete().eq('id', surat.id);
                return serverErrorResponse('Gagal mencatat rincian aset dalam surat', itemsError);
            }

            createdSurat = {
                ...surat,
                items: insertedItems || [],
            };
            break;
        }

        if (!createdSurat) {
            return serverErrorResponse('Gagal menerbitkan nomor surat setelah beberapa percobaan.');
        }

        return NextResponse.json(
            {
                surat: createdSurat,
                message: `Surat Serah Terima ${createdSurat.document_number} berhasil diterbitkan dalam status draft`,
            },
            { status: 201 }
        );
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat memproses surat', err);
    }
}
