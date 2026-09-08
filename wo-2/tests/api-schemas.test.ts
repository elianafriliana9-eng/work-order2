import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createAssetSchema,
    updateAssetSchema,
    createSuratSchema,
    signSuratSchema,
} from '../src/types/assets';

test('Validasi Schema createAssetSchema', () => {
    // Valid minimal
    const valid = createAssetSchema.safeParse({
        name: 'MacBook Air M2',
        category: 'Laptop',
        asset_value: 16000000,
    });
    assert.ok(valid.success);
    assert.equal(valid.data.status, 'available');
    assert.equal(valid.data.asset_value, 16000000);

    // Negative asset_value harus ditolak
    const negativeValue = createAssetSchema.safeParse({
        name: 'MacBook',
        category: 'Laptop',
        asset_value: -500,
    });
    assert.equal(negativeValue.success, false);

    // Status in_use tanpa holder_id harus ditolak
    const inUseNoHolder = createAssetSchema.safeParse({
        name: 'MacBook',
        category: 'Laptop',
        status: 'in_use',
    });
    assert.equal(inUseNoHolder.success, false);

    // Status in_use dengan holder_id valid
    const inUseWithHolder = createAssetSchema.safeParse({
        name: 'MacBook',
        category: 'Laptop',
        status: 'in_use',
        current_holder_id: '11111111-1111-1111-1111-111111111111',
    });
    assert.ok(inUseWithHolder.success);
});

test('Validasi Schema updateAssetSchema', () => {
    const valid = updateAssetSchema.safeParse({
        name: 'MacBook Air M2 Updated',
        asset_value: 17500000,
    });
    assert.ok(valid.success);

    // Update status in_use tetapi current_holder_id diset null harus ditolak
    const invalidHolder = updateAssetSchema.safeParse({
        status: 'in_use',
        current_holder_id: null,
    });
    assert.equal(invalidHolder.success, false);
});

test('Validasi Schema createSuratSchema', () => {
    const valid = createSuratSchema.safeParse({
        work_order_id: '11111111-1111-1111-1111-111111111111',
        document_type: 'penyerahan', // alias bahasa Indonesia terkonversi
        giver_id: '22222222-2222-2222-2222-222222222222',
        receiver_id: '33333333-3333-3333-3333-333333333333',
        giver_name: 'Budi',
        giver_department: 'IT',
        receiver_name: 'Dewi',
        receiver_department: 'HRD',
        asset_ids: ['44444444-4444-4444-4444-444444444444'],
    });

    assert.ok(valid.success);
    assert.equal(valid.data.document_type, 'handover');

    // Daftar aset kosong harus ditolak
    const emptyAssets = createSuratSchema.safeParse({
        work_order_id: '11111111-1111-1111-1111-111111111111',
        document_type: 'handover',
        giver_id: '22222222-2222-2222-2222-222222222222',
        receiver_id: '33333333-3333-3333-3333-333333333333',
        giver_name: 'Budi',
        giver_department: 'IT',
        receiver_name: 'Dewi',
        receiver_department: 'HRD',
        asset_ids: [],
    });
    assert.equal(emptyAssets.success, false);
});

test('Validasi Schema signSuratSchema', () => {
    const valid = signSuratSchema.safeParse({
        role: 'receiver',
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    });
    assert.ok(valid.success);

    // Tanda tangan string pendek / kosong harus ditolak
    const invalid = signSuratSchema.safeParse({
        signature: 'abc',
    });
    assert.equal(invalid.success, false);
});
