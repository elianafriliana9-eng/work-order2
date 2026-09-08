import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSuratExcel, EXCEL_COLUMNS } from '../src/lib/excel-generator';
import { SuratSerahTerima } from '../src/types/assets';

test('Generator Excel: Header kolom standar PT SRT dan format data', async () => {
    assert.equal(EXCEL_COLUMNS.length, 12);
    assert.deepEqual(
        EXCEL_COLUMNS.map(c => c.header),
        [
            'No',
            'Nomor Surat',
            'Tanggal',
            'Tanggal Singkat',
            'Kategori',
            'Nama Penyerah',
            'Dept. Penyerah',
            'Nama Penerima',
            'Dept. Penerima',
            'Keterangan',
            'Nama HRD',
            'Aset',
        ]
    );

    const dummySurat: SuratSerahTerima[] = [
        {
            id: '1',
            work_order_id: 'wo-1',
            document_number: '001/SRT-ST/2026',
            document_type: 'handover',
            document_date: '2026-03-25',
            giver_id: 'user-1',
            receiver_id: 'user-2',
            hrd_id: 'user-3',
            giver_name: 'Budi Santoso',
            giver_department: 'IT Support',
            receiver_name: 'Dewi Sartika',
            receiver_department: 'Finance',
            hrd_name: 'Rudi Hartono',
            notes: 'Serah terima laptop dinas',
            status: 'completed',
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
            created_by: 'user-1',
            updated_by: null,
            created_at: '2026-03-25T00:00:00Z',
            updated_at: '2026-03-25T00:00:00Z',
            items: [
                {
                    id: 'i1',
                    surat_id: '1',
                    asset_id: 'a1',
                    asset_code: 'LAP-001',
                    asset_name: 'Lenovo ThinkPad',
                    asset_category: 'Laptop',
                    asset_serial_number: 'SN123',
                    asset_value: 12000000,
                    handover_condition: 'Baik',
                    return_condition: null,
                    notes: null,
                    created_at: '',
                    updated_at: '',
                },
            ],
        },
    ];

    const excelBuffer = await generateSuratExcel(dummySurat);

    // Buffer validation
    assert.ok(Buffer.isBuffer(excelBuffer));
    assert.ok(excelBuffer.length > 2000);

    // ZIP Magic Bytes (PK\x03\x04) since .xlsx is an OpenXML ZIP archive
    assert.equal(excelBuffer[0], 0x50); // P
    assert.equal(excelBuffer[1], 0x4b); // K
    assert.equal(excelBuffer[2], 0x03);
    assert.equal(excelBuffer[3], 0x04);
});
