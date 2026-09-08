import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthUser,
    createAdminClient,
    unauthorizedResponse,
    forbiddenResponse,
    badRequestResponse,
    notFoundResponse,
    serverErrorResponse,
} from '@/lib/server-auth';
import { updateAssetSchema } from '@/types/assets';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/assets/[id]
 * Detail spesifik aset
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }

        const { id } = await params;
        if (!id) {
            return badRequestResponse('ID aset wajib disertakan');
        }

        const supabase = createAdminClient();
        const { data: asset, error } = await supabase
            .from('assets')
            .select(`
                *,
                current_holder:current_holder_id(id, full_name, division)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) {
            return serverErrorResponse('Gagal mengambil data aset', error);
        }
        if (!asset) {
            return notFoundResponse('Aset tidak ditemukan');
        }

        // Non-admin can only access if holding or available
        if (!isAdmin && asset.current_holder_id !== user.id && asset.status !== 'available') {
            return forbiddenResponse('Anda tidak memiliki izin melihat data aset ini');
        }

        return NextResponse.json({ asset });
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat mengambil aset', err);
    }
}

/**
 * PUT /api/assets/[id]
 * Update data katalog aset atau status pemegang
 * Akses: Khusus Admin / Head IT
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }
        if (!isAdmin) {
            return forbiddenResponse('Hanya Administrator atau Head IT yang berhak mengubah aset');
        }

        const { id } = await params;
        if (!id) {
            return badRequestResponse('ID aset wajib disertakan');
        }

        const body = await request.json();
        const validation = updateAssetSchema.safeParse(body);
        if (!validation.success) {
            return badRequestResponse('Data perubahan aset tidak valid', validation.error.issues);
        }

        const supabase = createAdminClient();

        // Check if asset exists
        const { data: currentAsset, error: fetchError } = await supabase
            .from('assets')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            return serverErrorResponse('Gagal memverifikasi aset', fetchError);
        }
        if (!currentAsset) {
            return notFoundResponse('Aset tidak ditemukan');
        }

        const updates = validation.data;
        const newStatus = updates.status || currentAsset.status;
        const newHolder = updates.current_holder_id !== undefined
            ? updates.current_holder_id
            : currentAsset.current_holder_id;

        // Consistency check: in_use must have holder
        if (newStatus === 'in_use' && !newHolder) {
            return badRequestResponse('Aset dengan status in_use wajib memiliki pemegang (current_holder_id)');
        }

        // If code is updated, check uniqueness
        if (updates.code && updates.code.trim().toUpperCase() !== currentAsset.code.toUpperCase()) {
            const normalizedCode = updates.code.trim().toUpperCase();
            const { data: codeConflict } = await supabase
                .from('assets')
                .select('id')
                .ilike('code', normalizedCode)
                .neq('id', id)
                .maybeSingle();

            if (codeConflict) {
                return badRequestResponse(`Kode aset '${normalizedCode}' sudah digunakan oleh aset lain`);
            }
            updates.code = normalizedCode;
        }

        const { data: updated, error: updateError } = await supabase
            .from('assets')
            .update({
                ...updates,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select(`
                *,
                current_holder:current_holder_id(id, full_name, division)
            `)
            .single();

        if (updateError) {
            return serverErrorResponse('Gagal memperbarui data aset', updateError);
        }

        return NextResponse.json({
            asset: updated,
            message: 'Aset berhasil diperbarui',
        });
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat memperbarui aset', err);
    }
}

/**
 * DELETE /api/assets/[id]
 * Hapus aset dari inventaris
 * Akses: Khusus Admin / Head IT
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }
        if (!isAdmin) {
            return forbiddenResponse('Hanya Administrator atau Head IT yang berhak menghapus aset');
        }

        const { id } = await params;
        if (!id) {
            return badRequestResponse('ID aset wajib disertakan');
        }

        const supabase = createAdminClient();

        // Check if asset exists
        const { data: asset, error: fetchErr } = await supabase
            .from('assets')
            .select('id, code, name')
            .eq('id', id)
            .maybeSingle();

        if (fetchErr) {
            return serverErrorResponse('Gagal memeriksa aset', fetchErr);
        }
        if (!asset) {
            return notFoundResponse('Aset tidak ditemukan');
        }

        // Check if asset is bound to any surat_serah_terima_items
        const { count, error: countErr } = await supabase
            .from('surat_serah_terima_items')
            .select('id', { count: 'exact', head: true })
            .eq('asset_id', id);

        if (!countErr && typeof count === 'number' && count > 0) {
            return badRequestResponse(
                `Aset '${asset.code}' (${asset.name}) tidak dapat dihapus karena sudah tercatat dalam ${count} surat serah terima`
            );
        }

        const { error: deleteErr } = await supabase
            .from('assets')
            .delete()
            .eq('id', id);

        if (deleteErr) {
            return serverErrorResponse('Gagal menghapus aset', deleteErr);
        }

        return NextResponse.json({
            ok: true,
            message: `Aset ${asset.code} berhasil dihapus dari katalog`,
        });
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat menghapus aset', err);
    }
}
