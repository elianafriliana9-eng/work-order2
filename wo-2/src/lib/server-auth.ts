import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export interface UserProfile {
    id: string;
    full_name: string | null;
    role: string;
    division: string | null;
    pic_name?: string | null;
}

export interface AuthContext {
    user: User | null;
    profile: UserProfile | null;
    isAdmin: boolean;
    error?: string;
}

export const SUPABASE_CONFIG = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://ropwebyycwvsvdrbgnpn.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
};

/**
 * Creates a server Supabase client bound to the incoming request (bearer token or cookies)
 */
export function createRouteHandlerClient(request: NextRequest): SupabaseClient {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: { persistSession: false },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });
    }

    return createServerClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set() {},
                remove() {},
            },
        }
    );
}

/**
 * Creates an admin/service-role Supabase client for backend operations, storage, and RPC
 */
export function createAdminClient(): SupabaseClient {
    const key = SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.anonKey;
    return createClient(SUPABASE_CONFIG.url, key, {
        auth: { persistSession: false },
    });
}

/**
 * Helper to check if a role represents an Asset Administrator
 */
export function isAssetAdminRole(role?: string | null, appMetadataRole?: string | null): boolean {
    const normalizedRole = (role || '').toLowerCase().trim();
    const normalizedAppRole = (appMetadataRole || '').toLowerCase().trim();
    const adminRoles = ['admin', 'head_it', 'asset_admin'];
    return adminRoles.includes(normalizedRole) || adminRoles.includes(normalizedAppRole);
}

/**
 * Authenticate incoming request and retrieve user, profile, and admin permissions
 */
export async function getAuthUser(request: NextRequest): Promise<AuthContext> {
    try {
        // Test environment hook for isolated unit/integration tests
        if (process.env.NODE_ENV === 'test' && request.headers.get('x-test-user-id')) {
            const testUserId = request.headers.get('x-test-user-id')!;
            const testRole = request.headers.get('x-test-role') || 'user';
            const testEmail = request.headers.get('x-test-email') || 'test@example.com';
            const isAdmin = isAssetAdminRole(testRole);
            return {
                user: { id: testUserId, email: testEmail, app_metadata: { role: testRole }, user_metadata: {} } as unknown as User,
                profile: { id: testUserId, full_name: 'Test User', role: testRole, division: 'IT' },
                isAdmin,
            };
        }

        const client = createRouteHandlerClient(request);
        const authHeader = request.headers.get('authorization');
        let user: User | null = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7).trim();
            const { data, error } = await client.auth.getUser(token);
            if (!error && data?.user) {
                user = data.user;
            }
        } else {
            const { data, error } = await client.auth.getUser();
            if (!error && data?.user) {
                user = data.user;
            }
        }

        if (!user) {
            return {
                user: null,
                profile: null,
                isAdmin: false,
                error: 'Sesi autentikasi tidak valid atau sudah kedaluwarsa.',
            };
        }

        // Query user profile for role verification
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('id, full_name, role, division, pic_name')
            .eq('id', user.id)
            .maybeSingle();

        const role = profile?.role || (user.user_metadata?.role as string) || (user.app_metadata?.role as string) || 'user';
        const isAdmin = isAssetAdminRole(role, user.app_metadata?.role as string);

        return {
            user,
            profile: profile ? { ...profile, role } : { id: user.id, full_name: user.email?.split('@')[0] || 'User', role, division: null },
            isAdmin,
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memverifikasi autentikasi.';
        return {
            user: null,
            profile: null,
            isAdmin: false,
            error: message,
        };
    }
}

export function unauthorizedResponse(message = 'Akses ditolak: Autentikasi sesi Supabase diperlukan') {
    return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini') {
    return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequestResponse(message: string, details?: unknown) {
    return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFoundResponse(message = 'Data tidak ditemukan') {
    return NextResponse.json({ error: message }, { status: 404 });
}

export function serverErrorResponse(message = 'Terjadi kesalahan internal pada server', error?: unknown) {
    console.error('[API Error]', message, error);
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
    return NextResponse.json(
        { error: message, message: errorMessage },
        { status: 500 }
    );
}
