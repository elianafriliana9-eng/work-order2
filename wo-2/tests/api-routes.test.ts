import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { isAssetAdminRole } from '../src/lib/server-auth';

// Import Route Handlers
import { GET as getAssets, POST as postAsset } from '../src/app/api/assets/route';
import { GET as getAssetById, PUT as putAsset, DELETE as deleteAsset } from '../src/app/api/assets/[id]/route';
import { GET as getSurat, POST as postSurat } from '../src/app/api/surat/route';
import { GET as getSuratById } from '../src/app/api/surat/[id]/route';
import { POST as signSurat } from '../src/app/api/surat/[id]/sign/route';
import { GET as getSuratPdf } from '../src/app/api/surat/[id]/pdf/route';
import { GET as exportSuratExcel } from '../src/app/api/surat/export/route';

Object.assign(process.env, { NODE_ENV: 'test' });

test('Verifikasi Aturan Hak Akses: isAssetAdminRole', () => {
    assert.equal(isAssetAdminRole('admin'), true);
    assert.equal(isAssetAdminRole('head_it'), true);
    assert.equal(isAssetAdminRole('HEAD_IT'), true);
    assert.equal(isAssetAdminRole('ADMIN'), true);
    assert.equal(isAssetAdminRole(null, 'head_it'), true);
    assert.equal(isAssetAdminRole('user'), false);
    assert.equal(isAssetAdminRole('designer'), false);
    assert.equal(isAssetAdminRole('it_dev'), false);
    assert.equal(isAssetAdminRole(undefined, undefined), false);
});

test('Endpoint Protection: Seluruh API menolak request unauthenticated dengan status 401', async () => {
    // 1. GET /api/assets
    const reqGetAssets = new NextRequest('http://localhost:3000/api/assets');
    const resGetAssets = await getAssets(reqGetAssets);
    assert.equal(resGetAssets.status, 401, 'GET /api/assets harus 401 jika unauthenticated');

    // 2. POST /api/assets
    const reqPostAsset = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        body: JSON.stringify({ name: 'Laptop Test', category: 'Laptop' }),
    });
    const resPostAsset = await postAsset(reqPostAsset);
    assert.equal(resPostAsset.status, 401, 'POST /api/assets harus 401 jika unauthenticated');

    // 3. GET /api/assets/[id]
    const dummyParams = { params: Promise.resolve({ id: 'dummy-id' }) };
    const reqGetAssetId = new NextRequest('http://localhost:3000/api/assets/dummy-id');
    const resGetAssetId = await getAssetById(reqGetAssetId, dummyParams);
    assert.equal(resGetAssetId.status, 401, 'GET /api/assets/[id] harus 401 jika unauthenticated');

    // 4. PUT /api/assets/[id]
    const reqPutAsset = new NextRequest('http://localhost:3000/api/assets/dummy-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
    });
    const resPutAsset = await putAsset(reqPutAsset, dummyParams);
    assert.equal(resPutAsset.status, 401, 'PUT /api/assets/[id] harus 401 jika unauthenticated');

    // 5. DELETE /api/assets/[id]
    const reqDeleteAsset = new NextRequest('http://localhost:3000/api/assets/dummy-id', {
        method: 'DELETE',
    });
    const resDeleteAsset = await deleteAsset(reqDeleteAsset, dummyParams);
    assert.equal(resDeleteAsset.status, 401, 'DELETE /api/assets/[id] harus 401 jika unauthenticated');

    // 6. GET /api/surat
    const reqGetSurat = new NextRequest('http://localhost:3000/api/surat');
    const resGetSurat = await getSurat(reqGetSurat);
    assert.equal(resGetSurat.status, 401, 'GET /api/surat harus 401 jika unauthenticated');

    // 7. POST /api/surat
    const reqPostSurat = new NextRequest('http://localhost:3000/api/surat', {
        method: 'POST',
        body: JSON.stringify({ document_type: 'handover' }),
    });
    const resPostSurat = await postSurat(reqPostSurat);
    assert.equal(resPostSurat.status, 401, 'POST /api/surat harus 401 jika unauthenticated');

    // 8. GET /api/surat/[id]
    const reqGetSuratId = new NextRequest('http://localhost:3000/api/surat/dummy-id');
    const resGetSuratId = await getSuratById(reqGetSuratId, dummyParams);
    assert.equal(resGetSuratId.status, 401, 'GET /api/surat/[id] harus 401 jika unauthenticated');

    // 9. POST /api/surat/[id]/sign
    const reqSignSurat = new NextRequest('http://localhost:3000/api/surat/dummy-id/sign', {
        method: 'POST',
        body: JSON.stringify({ signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' }),
    });
    const resSignSurat = await signSurat(reqSignSurat, dummyParams);
    assert.equal(resSignSurat.status, 401, 'POST /api/surat/[id]/sign harus 401 jika unauthenticated');

    // 10. GET /api/surat/[id]/pdf
    const reqGetPdf = new NextRequest('http://localhost:3000/api/surat/dummy-id/pdf');
    const resGetPdf = await getSuratPdf(reqGetPdf, dummyParams);
    assert.equal(resGetPdf.status, 401, 'GET /api/surat/[id]/pdf harus 401 jika unauthenticated');

    // 11. GET /api/surat/export
    const reqExport = new NextRequest('http://localhost:3000/api/surat/export');
    const resExport = await exportSuratExcel(reqExport);
    assert.equal(resExport.status, 401, 'GET /api/surat/export harus 401 jika unauthenticated');
});

test('Role Check: Mutasi aset dan surat oleh role non-admin (user biasa) ditolak dengan 403 Forbidden', async () => {
    const userHeaders = {
        'x-test-user-id': '99999999-9999-9999-9999-999999999999',
        'x-test-role': 'user',
    };

    const dummyParams = { params: Promise.resolve({ id: 'dummy-id' }) };

    // 1. POST /api/assets (tambah aset) oleh user biasa
    const reqPostAsset = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: userHeaders,
        body: JSON.stringify({ name: 'MacBook Pro', category: 'Laptop' }),
    });
    const resPostAsset = await postAsset(reqPostAsset);
    assert.equal(resPostAsset.status, 403, 'POST /api/assets harus 403 jika role = user');

    // 2. PUT /api/assets/[id] (ubah aset) oleh user biasa
    const reqPutAsset = new NextRequest('http://localhost:3000/api/assets/dummy-id', {
        method: 'PUT',
        headers: userHeaders,
        body: JSON.stringify({ name: 'MacBook Pro Updated' }),
    });
    const resPutAsset = await putAsset(reqPutAsset, dummyParams);
    assert.equal(resPutAsset.status, 403, 'PUT /api/assets/[id] harus 403 jika role = user');

    // 3. DELETE /api/assets/[id] (hapus aset) oleh user biasa
    const reqDeleteAsset = new NextRequest('http://localhost:3000/api/assets/dummy-id', {
        method: 'DELETE',
        headers: userHeaders,
    });
    const resDeleteAsset = await deleteAsset(reqDeleteAsset, dummyParams);
    assert.equal(resDeleteAsset.status, 403, 'DELETE /api/assets/[id] harus 403 jika role = user');

    // 4. POST /api/surat (terbitkan surat) oleh user biasa
    const reqPostSurat = new NextRequest('http://localhost:3000/api/surat', {
        method: 'POST',
        headers: userHeaders,
        body: JSON.stringify({
            work_order_id: '11111111-1111-1111-1111-111111111111',
            document_type: 'handover',
            giver_id: '22222222-2222-2222-2222-222222222222',
            receiver_id: '33333333-3333-3333-3333-333333333333',
            giver_name: 'Budi',
            giver_department: 'IT',
            receiver_name: 'Dewi',
            receiver_department: 'Marketing',
            asset_ids: ['44444444-4444-4444-4444-444444444444'],
        }),
    });
    const resPostSurat = await postSurat(reqPostSurat);
    assert.equal(resPostSurat.status, 403, 'POST /api/surat harus 403 jika role = user');
});

test('Validasi Payload: Input tidak valid pada POST /api/assets dan POST /api/surat menghasilkan 400 Bad Request', async () => {
    const adminHeaders = {
        'x-test-user-id': '00000000-0000-0000-0000-000000000001',
        'x-test-role': 'head_it',
    };

    // Body kosong pada POST /api/assets
    const reqBadAsset = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({}),
    });
    const resBadAsset = await postAsset(reqBadAsset);
    assert.equal(resBadAsset.status, 400);
    const jsonBadAsset = await resBadAsset.json();
    assert.ok(jsonBadAsset.error);

    // Body tanpa asset_ids pada POST /api/surat
    const reqBadSurat = new NextRequest('http://localhost:3000/api/surat', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
            work_order_id: '11111111-1111-1111-1111-111111111111',
            document_type: 'handover',
            giver_id: '22222222-2222-2222-2222-222222222222',
            receiver_id: '33333333-3333-3333-3333-333333333333',
            giver_name: 'Budi',
            giver_department: 'IT',
            receiver_name: 'Dewi',
            receiver_department: 'Marketing',
            asset_ids: [],
        }),
    });
    const resBadSurat = await postSurat(reqBadSurat);
    assert.equal(resBadSurat.status, 400);
    const jsonBadSurat = await resBadSurat.json();
    assert.ok(jsonBadSurat.error);
});
