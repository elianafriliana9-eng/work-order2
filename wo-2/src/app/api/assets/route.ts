import { NextRequest, NextResponse } from 'next/server';
import {
    getAuthUser,
    createAdminClient,
    unauthorizedResponse,
    forbiddenResponse,
    badRequestResponse,
    serverErrorResponse,
} from '@/lib/server-auth';
import { createAssetSchema } from '@/types/assets';
import { generateNextAssetCode } from '@/lib/surat-number';

/**
 * GET /api/assets
 * Ambil katalog aset dengan filter status, pencarian keyword, pagination
 * Akses: Authenticated user (Admin melihat semua, User melihat aset terkait)
 */
export async function GET(request: NextRequest) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const search = searchParams.get('search') || searchParams.get('q');
        const holderId = searchParams.get('holder_id');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const offset = (page - 1) * limit;

        const supabase = createAdminClient();
        let query = supabase
            .from('assets')
            .select(`
                *,
                current_holder:current_holder_id(id, full_name, division)
            `, { count: 'exact' });

        // Non-admin can only see their held assets or available catalog
        if (!isAdmin) {
            const filterMine = searchParams.get('mine') === 'true';
            if (filterMine) {
                query = query.eq('current_holder_id', user.id);
            } else {
                query = query.or(`current_holder_id.eq.${user.id},status.eq.available`);
            }
        } else if (holderId) {
            query = query.eq('current_holder_id', holderId);
        }

        // Apply filters
        if (status) {
            if (status.includes(',')) {
                const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
                query = query.in('status', statuses);
            } else {
                query = query.eq('status', status.trim());
            }
        }

        if (category) {
            query = query.ilike('category', `%${category.trim()}%`);
        }

        if (search) {
            const term = search.trim();
            query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%,category.ilike.%${term}%,serial_number.ilike.%${term}%`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (error) {
            return serverErrorResponse('Gagal mengambil daftar aset', error);
        }

        return NextResponse.json({
            assets: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat memproses permintaan', err);
    }
}

/**
 * POST /api/assets
 * Tambah aset baru ke inventaris
 * Akses: Khusus Admin / Head IT
 */
export async function POST(request: NextRequest) {
    try {
        const { user, isAdmin, error: authError } = await getAuthUser(request);
        if (!user) {
            return unauthorizedResponse(authError);
        }
        if (!isAdmin) {
            return forbiddenResponse('Hanya Administrator atau Head IT yang berhak menambah aset baru');
        }

        const body = await request.json();
        const validation = createAssetSchema.safeParse(body);
        if (!validation.success) {
            return badRequestResponse('Data aset tidak valid', validation.error.issues);
        }

        const supabase = createAdminClient();
        const payload = validation.data;

        // Auto-generate code if missing
        let code = payload.code;
        if (!code || !code.trim()) {
            code = await generateNextAssetCode(payload.category, supabase);
        } else {
            code = code.trim().toUpperCase();
            // Validate unique case-insensitive code
            const { data: existing } = await supabase
                .from('assets')
                .select('id')
                .ilike('code', code)
                .maybeSingle();

            if (existing) {
                return badRequestResponse(`Kode aset '${code}' sudah digunakan oleh aset lain`);
            }
        }

        const { data: asset, error: insertError } = await supabase
            .from('assets')
            .insert({
                code,
                name: payload.name.trim(),
                category: payload.category.trim(),
                serial_number: payload.serial_number ? payload.serial_number.trim() : null,
                asset_value: payload.asset_value,
                status: payload.status,
                current_holder_id: payload.current_holder_id || null,
                acquired_at: payload.acquired_at || null,
                notes: payload.notes ? payload.notes.trim() : null,
                created_by: user.id,
            })
            .select(`
                *,
                current_holder:current_holder_id(id, full_name, division)
            `)
            .single();

        if (insertError) {
            if (insertError.code === '23505') {
                return badRequestResponse(`Kode aset '${code}' atau nomor seri sudah terdaftar`);
            }
            return serverErrorResponse('Gagal menyimpan aset baru', insertError);
        }

        return NextResponse.json(
            {
                asset,
                message: 'Aset baru berhasil ditambahkan',
            },
            { status: 201 }
        );
    } catch (err: unknown) {
        return serverErrorResponse('Terjadi kesalahan saat menambahkan aset', err);
    }
}
