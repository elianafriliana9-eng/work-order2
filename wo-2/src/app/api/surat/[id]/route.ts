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

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/surat/[id]
 * Detail dokumen surat beserta daftar item aset dan status tanda tangan
 * Akses: Admin melihat semua, User melihat surat di mana mereka menjadi pihak terkait
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }

        const { id } = await params;
        if (!id) {
            return badRequestResponse('ID surat wajib disertakan');
        }

        const supabase = createAdminClient();
        const { data: surat, error } = await supabase
            .from('surat_serah_terima')
            .select(`
                *,
                items:surat_serah_terima_items(*),
                work_order:work_order_id(id, ticket_number, title, status, category)
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) {
            return serverErrorResponse('Gagal mengambil data surat', error);
        }
        if (!surat) {
            return notFoundResponse('Dokumen surat serah terima tidak ditemukan');
        }

        // Check participant permission
        const isParticipant = [
            surat.giver_id,
            surat.receiver_id,
            surat.hrd_id,
            surat.created_by,
        ].filter(Boolean).includes(user.id);

        if (!isAdmin && !isParticipant) {
            return forbiddenResponse('Anda tidak memiliki izin untuk melihat dokumen ini');
        }

        // Summary signature status
        const signatureStatus = {
            isGiverSigned: Boolean(surat.giver_signature_path && surat.giver_signed_at),
            isReceiverSigned: Boolean(surat.receiver_signature_path && surat.receiver_signed_at),
            isHrdSigned: Boolean(surat.hrd_signature_path && surat.hrd_signed_at),
            needsHrd: Boolean(surat.hrd_id),
            isComplete: surat.status === 'completed',
            isCancelled: surat.status === 'cancelled',
        };

        return NextResponse.json({
            surat: {
                ...surat,
                signature_status: signatureStatus,
            },
        });
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat memproses detail surat', err);
    }
}
