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
import { generateSuratPdf } from '@/lib/pdf-generator';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/surat/[id]/pdf
 * Generator PDF satu halaman standar visual PT SRT menggunakan PDFKit,
 * dilengkapi QR Code verifikasi dokumen.
 * Akses: Admin atau pihak terkait (giver/receiver/hrd/creator)
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
        const { data: surat, error: fetchErr } = await supabase
            .from('surat_serah_terima')
            .select(`
                *,
                items:surat_serah_terima_items(*)
            `)
            .eq('id', id)
            .maybeSingle();

        if (fetchErr) {
            return serverErrorResponse('Gagal mengambil data surat', fetchErr);
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
            return forbiddenResponse('Anda tidak memiliki izin untuk mengunduh dokumen ini');
        }

        // Generate PDF Buffer
        const host = request.headers.get('host') || 'digitalteamsrt.com';
        const proto = request.headers.get('x-forwarded-proto') || 'https';
        const verificationBaseUrl = `${proto}://${host}/surat/verify`;

        const pdfBuffer = await generateSuratPdf(surat, { verificationBaseUrl });

        const { searchParams } = new URL(request.url);
        const isDownload = searchParams.get('download') === 'true';
        const safeDocNo = (surat.document_number || 'SST').replace(/[\/\\?%*:|"<>]/g, '-');
        const filename = `Surat-Serah-Terima-${safeDocNo}.pdf`;

        const disposition = isDownload ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': disposition,
                'Content-Length': String(pdfBuffer.length),
                'Cache-Control': 'no-store, must-revalidate',
            },
        });
    } catch (err: unknown) {
        return serverErrorResponse('Gagal menghasilkan file PDF', err);
    }
}
