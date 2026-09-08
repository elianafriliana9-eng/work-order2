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
import { signSuratSchema, type SuratSerahTerima } from '@/types/assets';
import { generateSuratPdf } from '@/lib/pdf-generator';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/surat/[id]/sign
 * Endpoint penyimpanan tanda tangan digital penyerah, penerima, atau HRD
 * Akses: User terkait (giver/receiver/hrd) atau Admin
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }

        const { id } = await params;
        if (!id) {
            return badRequestResponse('ID surat wajib disertakan');
        }

        const body = await request.json();
        const validation = signSuratSchema.safeParse(body);
        if (!validation.success) {
            return badRequestResponse('Data tanda tangan tidak valid', validation.error.issues);
        }

        const { signature, role: explicitRole } = validation.data;
        const supabase = createAdminClient();

        // 1. Ambil data surat beserta item
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

        // Cek apakah dokumen sudah final atau dibatalkan
        if (surat.status === 'completed') {
            return badRequestResponse('Dokumen telah selesai (completed) dan tidak dapat ditandatangani lagi');
        }
        if (surat.status === 'cancelled') {
            return badRequestResponse('Dokumen telah dibatalkan (cancelled) dan tidak dapat ditandatangani');
        }

        // 2. Tentukan peran penandatangan
        let targetRole: 'giver' | 'receiver' | 'hrd' | null = null;
        if (explicitRole) {
            targetRole = explicitRole;
        } else if (user.id === surat.giver_id) {
            targetRole = 'giver';
        } else if (user.id === surat.receiver_id) {
            targetRole = 'receiver';
        } else if (surat.hrd_id && user.id === surat.hrd_id) {
            targetRole = 'hrd';
        } else if (isAdmin) {
            targetRole = surat.status === 'draft' ? 'giver' : 'receiver';
        }

        if (!targetRole) {
            return forbiddenResponse('Anda tidak terdaftar sebagai pihak penandatangan pada dokumen ini');
        }

        // 3. Verifikasi otorisasi penandatangan untuk role tersebut
        if (targetRole === 'giver') {
            if (user.id !== surat.giver_id && !isAdmin) {
                return forbiddenResponse('Hanya pihak penyerah atau Administrator yang dapat menandatangani bagian penyerah');
            }
            if (surat.status !== 'draft') {
                return badRequestResponse('Hanya surat berstatus draft yang dapat ditandatangani oleh penyerah');
            }
        } else if (targetRole === 'receiver') {
            if (user.id !== surat.receiver_id && !isAdmin) {
                return forbiddenResponse('Hanya pihak penerima yang dapat menandatangani tanda terima ini');
            }
            if (surat.status !== 'awaiting_recipient_signature') {
                return badRequestResponse('Surat belum siap ditandatangani oleh penerima atau belum ditandatangani oleh penyerah');
            }
        } else if (targetRole === 'hrd') {
            if (!surat.hrd_id) {
                return badRequestResponse('Dokumen ini tidak memerlukan pengesahan tanda tangan HRD');
            }
            if (user.id !== surat.hrd_id && !isAdmin) {
                return forbiddenResponse('Hanya HRD yang ditugaskan yang dapat menandatangani bagian HRD');
            }
        }

        // 4. Unggah/Simpan file tanda tangan ke Supabase Storage (atau fallback direct data)
        let signaturePath = signature;
        if (signature.startsWith('data:image')) {
            try {
                const base64Data = signature.split(',')[1];
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const filePath = `${surat.id}/${targetRole}_signature_${Date.now()}.png`;

                const { error: storageError } = await supabase.storage
                    .from('surat-signatures')
                    .upload(filePath, imageBuffer, {
                        contentType: 'image/png',
                        upsert: true,
                    });

                if (!storageError) {
                    signaturePath = filePath;
                }
            } catch {
                // Gunakan signature string jika storage mengalami hambatan
            }
        }

        const nowIso = new Date().toISOString();
        let updatedSurat: SuratSerahTerima | null = null;

        // 5. Eksekusi penyimpanan tanda tangan
        if (targetRole === 'giver') {
            // Coba RPC terlebih dahulu
            const { data: rpcData, error: rpcErr } = await supabase.rpc('sign_surat_as_giver', {
                p_surat_id: surat.id,
                p_signature_path: signaturePath,
            });

            if (!rpcErr && rpcData) {
                updatedSurat = rpcData;
            } else {
                // Fallback direct update
                const { data: direct, error: dirErr } = await supabase
                    .from('surat_serah_terima')
                    .update({
                        giver_signature_path: signaturePath,
                        giver_signed_at: nowIso,
                        status: 'awaiting_recipient_signature',
                        updated_by: user.id,
                    })
                    .eq('id', surat.id)
                    .select('*, items:surat_serah_terima_items(*)')
                    .single();

                if (dirErr) return serverErrorResponse('Gagal menyimpan tanda tangan penyerah', dirErr);
                updatedSurat = direct;
            }
        } else if (targetRole === 'receiver') {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('sign_surat_as_receiver', {
                p_surat_id: surat.id,
                p_signature_path: signaturePath,
            });

            if (!rpcErr && rpcData) {
                updatedSurat = rpcData;
            } else {
                const { data: direct, error: dirErr } = await supabase
                    .from('surat_serah_terima')
                    .update({
                        receiver_signature_path: signaturePath,
                        receiver_signed_at: nowIso,
                        updated_by: user.id,
                    })
                    .eq('id', surat.id)
                    .select('*, items:surat_serah_terima_items(*)')
                    .single();

                if (dirErr) return serverErrorResponse('Gagal menyimpan tanda tangan penerima', dirErr);
                updatedSurat = direct;
            }
        } else if (targetRole === 'hrd') {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('sign_surat_as_hrd', {
                p_surat_id: surat.id,
                p_signature_path: signaturePath,
            });

            if (!rpcErr && rpcData) {
                updatedSurat = rpcData;
            } else {
                const { data: direct, error: dirErr } = await supabase
                    .from('surat_serah_terima')
                    .update({
                        hrd_signature_path: signaturePath,
                        hrd_signed_at: nowIso,
                        updated_by: user.id,
                    })
                    .eq('id', surat.id)
                    .select('*, items:surat_serah_terima_items(*)')
                    .single();

                if (dirErr) return serverErrorResponse('Gagal menyimpan tanda tangan HRD', dirErr);
                updatedSurat = direct;
            }
        }

        if (!updatedSurat) {
            return serverErrorResponse('Gagal memuat pembaruan data surat setelah proses tanda tangan');
        }

        // 6. Cek apakah tanda tangan sudah lengkap untuk finalisasi
        const hasGiverSign = Boolean(updatedSurat.giver_signature_path);
        const hasReceiverSign = Boolean(updatedSurat.receiver_signature_path);
        const hasHrdSign = !updatedSurat.hrd_id || Boolean(updatedSurat.hrd_signature_path);
        let finalized = false;

        if (hasGiverSign && hasReceiverSign && hasHrdSign && updatedSurat.status !== 'completed') {
            try {
                // Generate PDF arsip resmi
                const pdfBuffer = await generateSuratPdf(updatedSurat);
                const pdfPath = `${updatedSurat.id}/surat_${updatedSurat.document_number.replace(/[\/\\]/g, '-')}.pdf`;

                await supabase.storage
                    .from('surat-pdf')
                    .upload(pdfPath, pdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: true,
                    });

                // Coba RPC finalize_surat
                const { data: finData, error: finErr } = await supabase.rpc('finalize_surat', {
                    p_surat_id: updatedSurat.id,
                    p_pdf_path: pdfPath,
                });

                if (!finErr && finData) {
                    updatedSurat = finData;
                    finalized = true;
                } else {
                    // Fallback direct finalization
                    // a. Mutasi aset
                    const items = updatedSurat.items || [];
                    for (const item of items) {
                        if (updatedSurat.document_type === 'handover') {
                            await supabase
                                .from('assets')
                                .update({
                                    status: 'in_use',
                                    current_holder_id: updatedSurat.receiver_id,
                                    updated_by: user.id,
                                })
                                .eq('id', item.asset_id);
                        } else {
                            await supabase
                                .from('assets')
                                .update({
                                    status: 'available',
                                    current_holder_id: null,
                                    updated_by: user.id,
                                })
                                .eq('id', item.asset_id);
                        }
                    }

                    // b. Update surat
                    const { data: finDirect } = await supabase
                        .from('surat_serah_terima')
                        .update({
                            status: 'completed',
                            pdf_path: pdfPath,
                            finalized_at: new Date().toISOString(),
                            updated_by: user.id,
                        })
                        .eq('id', updatedSurat.id)
                        .select('*, items:surat_serah_terima_items(*)')
                        .single();

                    if (finDirect) {
                        updatedSurat = finDirect;
                        finalized = true;
                    }

                    // c. Sinkronisasi status tiket Work Order
                    const targetWorkOrderId = updatedSurat?.work_order_id;
                    if (targetWorkOrderId) {
                        await supabase
                            .from('work_orders')
                            .update({
                                status: 'Completed',
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', targetWorkOrderId);
                    }
                }
            } catch (finError) {
                console.error('[Finalization Error]', finError);
            }
        }

        return NextResponse.json({
            surat: updatedSurat,
            role: targetRole,
            finalized,
            message: finalized
                ? 'Tanda tangan lengkap. Dokumen surat serah terima telah difinalisasi dan berstatus Selesai.'
                : `Tanda tangan ${targetRole} berhasil disimpan.`,
        });
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat menyimpan tanda tangan', err);
    }
}
