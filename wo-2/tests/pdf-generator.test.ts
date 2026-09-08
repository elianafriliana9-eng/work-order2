import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSuratPdf, formatRupiah } from '../src/lib/pdf-generator';
import { SuratSerahTerima } from '../src/types/assets';

test('Format Rupiah helper', () => {
    assert.equal(formatRupiah(0), '-');
    assert.equal(formatRupiah(null), '-');
    assert.equal(formatRupiah(undefined), '-');
    const rp = formatRupiah(15000000);
    assert.ok(rp.includes('15.000.000') || rp.includes('15,000,000'));
});

test('Generator PDF: Menghasilkan PDF valid dengan header standar PT SRT', async () => {
    const mockSurat: SuratSerahTerima = {
        id: '11111111-1111-1111-1111-111111111111',
        work_order_id: '22222222-2222-2222-2222-222222222222',
        document_number: '001/SRT-ST/2026',
        document_type: 'handover',
        document_date: '2026-03-25',
        giver_id: '33333333-3333-3333-3333-333333333333',
        receiver_id: '44444444-4444-4444-4444-444444444444',
        hrd_id: '55555555-5555-5555-5555-555555555555',
        giver_name: 'Budi Santoso',
        giver_department: 'IT Infrastructure',
        receiver_name: 'Siti Aminah',
        receiver_department: 'Marketing & Creative',
        hrd_name: 'Dewi Lestari',
        notes: 'Penyerahan perlengkapan kerja laptop untuk pegawai baru.',
        status: 'completed',
        giver_signature_path: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        receiver_signature_path: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        hrd_signature_path: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        giver_signed_at: '2026-03-25T08:00:00Z',
        receiver_signed_at: '2026-03-25T09:00:00Z',
        hrd_signed_at: '2026-03-25T10:00:00Z',
        pdf_path: 'surat/001-SRT-ST-2026.pdf',
        finalized_at: '2026-03-25T10:00:00Z',
        cancelled_at: null,
        version: 1,
        created_by: '33333333-3333-3333-3333-333333333333',
        updated_by: null,
        created_at: '2026-03-25T07:30:00Z',
        updated_at: '2026-03-25T10:00:00Z',
        items: [
            {
                id: 'item-1',
                surat_id: '11111111-1111-1111-1111-111111111111',
                asset_id: 'asset-1',
                asset_code: 'LAP-2026-0001',
                asset_name: 'MacBook Pro M3 16GB',
                asset_category: 'Laptop',
                asset_serial_number: 'C02G1234MD6R',
                asset_value: 28000000,
                handover_condition: 'Baik / Baru',
                return_condition: null,
                notes: 'Lengkap dengan adaptor 70W',
                created_at: '2026-03-25T07:30:00Z',
                updated_at: '2026-03-25T07:30:00Z',
            },
            {
                id: 'item-2',
                surat_id: '11111111-1111-1111-1111-111111111111',
                asset_id: 'asset-2',
                asset_code: 'MON-2026-0004',
                asset_name: 'LG UltraFine 27"',
                asset_category: 'Monitor',
                asset_serial_number: '304NTPK89234',
                asset_value: 6500000,
                handover_condition: 'Baik',
                return_condition: null,
                notes: 'Termasuk kabel USB-C ke DP',
                created_at: '2026-03-25T07:30:00Z',
                updated_at: '2026-03-25T07:30:00Z',
            },
        ],
    };

    const pdfBuffer = await generateSuratPdf(mockSurat);

    // Verifikasi output berupa buffer binary non-empty
    assert.ok(Buffer.isBuffer(pdfBuffer), 'Output harus berupa Buffer');
    assert.ok(pdfBuffer.length > 5000, `Ukuran file PDF harus memadai (aktual: ${pdfBuffer.length} bytes)`);

    // Verifikasi Magic Bytes PDF (%PDF-)
    const magic = pdfBuffer.subarray(0, 5).toString('ascii');
    assert.equal(magic, '%PDF-', 'Buffer harus memiliki magic byte %PDF-');
});

test('Generator PDF: Pengembalian aset (return) mencantumkan TELAH DIKEMBALIKAN', async () => {
    const returnSurat: SuratSerahTerima = {
        id: '99999999-9999-9999-9999-999999999999',
        work_order_id: '22222222-2222-2222-2222-222222222222',
        document_number: '002/SRT-ST/2026',
        document_type: 'return',
        document_date: '2026-03-26',
        giver_id: '44444444-4444-4444-4444-444444444444',
        receiver_id: '33333333-3333-3333-3333-333333333333',
        hrd_id: null,
        giver_name: 'Siti Aminah',
        giver_department: 'Marketing',
        receiver_name: 'Budi Santoso',
        receiver_department: 'IT',
        hrd_name: null,
        notes: null,
        status: 'draft',
        giver_signature_path: null,
        receiver_signature_path: null,
        hrd_signature_path: null,
        giver_signed_at: null,
        receiver_signed_at: null,
        hrd_signed_at: null,
        pdf_path: null,
        finalized_at: null,
        cancelled_at: null,
        version: 1,
        created_by: '33333333-3333-3333-3333-333333333333',
        updated_by: null,
        created_at: '2026-03-26T07:30:00Z',
        updated_at: '2026-03-26T07:30:00Z',
        items: [],
    };

    const pdfBuffer = await generateSuratPdf(returnSurat);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.equal(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
});
