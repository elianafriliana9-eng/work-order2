import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatDateIndonesian, formatDateShort, generateNextDocumentNumber, generateNextAssetCode } from '../src/lib/surat-number';

test('Format Tanggal Indonesia: format lengkap dan format singkat', () => {
    const fixedDate = new Date(2026, 2, 25); // 25 Maret 2026
    assert.equal(formatDateIndonesian(fixedDate), '25 Maret 2026');
    assert.equal(formatDateShort(fixedDate), '25/03/2026');

    const newYearDate = new Date(2026, 0, 1); // 1 Januari 2026
    assert.equal(formatDateIndonesian(newYearDate), '1 Januari 2026');
    assert.equal(formatDateShort(newYearDate), '01/01/2026');
});

test('Penomoran Dokumen: format nomor standar PT SRT (.../SRT-ST/YYYY)', async () => {
    // Mock Supabase client with empty table
    const mockSupabase = {
        rpc: async () => ({ data: null, error: new Error('RPC not found') }),
        from: () => ({
            select: () => ({
                or: () => ({
                    limit: async () => ({
                        data: [
                            { document_number: '001/SRT-ST/2026' },
                            { document_number: '002/SRT-ST/2026' },
                        ],
                        error: null,
                    }),
                }),
            }),
        }),
    } as unknown as SupabaseClient;

    const nextDocNum = await generateNextDocumentNumber(mockSupabase);
    const currentYear = new Date().getFullYear();
    assert.equal(nextDocNum, `003/SRT-ST/${currentYear}`);
});

test('Penomoran Dokumen: proteksi race-condition dan increment sekuensial', async () => {
    let currentCounter = 5;
    const mockSupabase = {
        rpc: async () => {
            currentCounter += 1;
            return {
                data: `${String(currentCounter).padStart(6, '0')}/SST/2026`,
                error: null,
            };
        },
    } as unknown as SupabaseClient;

    // Parallel calls should serialize cleanly
    const [num1, num2] = await Promise.all([
        generateNextDocumentNumber(mockSupabase),
        generateNextDocumentNumber(mockSupabase),
    ]);

    assert.ok(num1.includes('/SRT-ST/2026'));
    assert.ok(num2.includes('/SRT-ST/2026'));
    assert.notEqual(num1, num2);
});

test('Generator Kode Aset: prefix kategori cerdas (LAP, MON, PC, PRN, AST)', async () => {
    const mockSupabase = {
        from: () => ({
            select: () => ({
                ilike: () => ({
                    limit: async () => ({
                        data: [
                            { code: 'LAP-2026-0001' },
                            { code: 'LAP-2026-0002' },
                        ],
                        error: null,
                    }),
                }),
            }),
        }),
    } as unknown as SupabaseClient;

    const currentYear = new Date().getFullYear();
    const laptopCode = await generateNextAssetCode('Laptop Asus ROG', mockSupabase);
    assert.equal(laptopCode, `LAP-${currentYear}-0003`);

    const monitorMock = {
        from: () => ({
            select: () => ({
                ilike: () => ({
                    limit: async () => ({ data: [], error: null }),
                }),
            }),
        }),
    } as unknown as SupabaseClient;

    const monitorCode = await generateNextAssetCode('Monitor Dell 27"', monitorMock);
    assert.equal(monitorCode, `MON-${currentYear}-0001`);

    const genericCode = await generateNextAssetCode('Peralatan Kantor Meja', monitorMock);
    assert.equal(genericCode, `AST-${currentYear}-0001`);
});
