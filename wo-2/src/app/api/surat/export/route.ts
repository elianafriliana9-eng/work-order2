import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthUser,
    createAdminClient,
    unauthorizedResponse,
    serverErrorResponse,
} from '@/lib/server-auth';
import { generateSuratExcel } from '@/lib/excel-generator';

/**
 * GET /api/surat/export
 * Ekspor riwayat surat serah terima dalam format Excel (.xlsx) menggunakan ExcelJS
 * Akses: Pengguna terautentikasi (Admin mengekspor seluruh riwayat, User riwayat terkait)
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
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const workOrderId = searchParams.get('work_order_id');

        const supabase = createAdminClient();
        let query = supabase
            .from('surat_serah_terima')
            .select(`
                *,
                items:surat_serah_terima_items(*)
            `);

        if (!isAdmin) {
            query = query.or(`giver_id.eq.${user.id},receiver_id.eq.${user.id},hrd_id.eq.${user.id},created_by.eq.${user.id}`);
        }

        if (status) {
            query = query.eq('status', status.trim());
        }

        if (docType) {
            const mappedType = docType === 'penyerahan' ? 'handover' : (docType === 'pengembalian' ? 'return' : docType);
            query = query.eq('document_type', mappedType);
        }

        if (startDate) {
            query = query.gte('document_date', startDate);
        }

        if (endDate) {
            query = query.lte('document_date', endDate);
        }

        if (workOrderId) {
            query = query.eq('work_order_id', workOrderId);
        }

        query = query.order('document_date', { ascending: false }).order('created_at', { ascending: false });

        const { data: suratList, error: queryErr } = await query;
        if (queryErr) {
            return serverErrorResponse('Gagal mengambil riwayat surat untuk diekspor', queryErr);
        }

        const excelBuffer = await generateSuratExcel(suratList || []);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `Riwayat-Surat-Serah-Terima-PT-SRT-${timestamp}.xlsx`;

        return new NextResponse(new Uint8Array(excelBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(excelBuffer.length),
                'Cache-Control': 'no-store, must-revalidate',
            },
        });
    } catch (err: unknown) {
        return serverErrorResponse('Gagal mengekspor data ke format Excel', err);
    }
}
