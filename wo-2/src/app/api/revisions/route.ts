import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Schema for revision submission validation
const revisionSchema = z.object({
    wo_id: z.string().uuid(),
    revision_type: z.enum(['minor', 'major']),
    description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
    changes_requested: z.string().min(20, 'Perubahan yang diminta minimal 20 karakter'),
    is_concept_change: z.boolean().default(false),
    concept_change_reason: z.string().optional(),
    requires_new_ticket: z.boolean().default(false),
    attachment_urls: z.array(z.string().url()).default([]),
});

export async function POST(request: NextRequest) {
    try {
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: 'Supabase configuration missing' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const validation = revisionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { 
                    error: 'Validasi gagal',
                    details: validation.error.issues 
                },
                { status: 400 }
            );
        }

        const { wo_id, ...revisionData } = validation.data;

        // Verify user owns this work order
        const { data: wo, error: woError } = await supabase
            .from('work_orders')
            .select('status, review_started_at, revision_window_expires_at')
            .eq('id', wo_id)
            .eq('user_id', user.id)
            .single();

        if (woError || !wo) {
            return NextResponse.json(
                { error: 'Work order tidak ditemukan' },
                { status: 404 }
            );
        }

        // Check if status is Review
        if (wo.status !== 'Review') {
            return NextResponse.json(
                { error: 'Revisi hanya bisa diajukan saat status Review' },
                { status: 400 }
            );
        }

        // Check revision limit (max 2)
        const MAX_REVISIONS = 2;
        const { count: existingCount } = await supabase
            .from('work_order_revisions')
            .select('*', { count: 'exact', head: true })
            .eq('wo_id', wo_id);

        if (existingCount !== null && existingCount >= MAX_REVISIONS) {
            return NextResponse.json(
                { error: `Batas maksimal revisi (${MAX_REVISIONS}) telah tercapai` },
                { status: 400 }
            );
        }

        // Check 24-hour window
        if (wo.revision_window_expires_at) {
            const now = new Date();
            const expiresAt = new Date(wo.revision_window_expires_at);

            if (now >= expiresAt) {
                return NextResponse.json(
                    {
                        error: 'Batas waktu pengajuan revisi telah berakhir (24 jam)',
                        expired_at: wo.revision_window_expires_at
                    },
                    { status: 400 }
                );
            }
        }

        // Calculate remaining time for response
        let timeWarning: string | null = null;
        let remainingHours = 24;
        let remainingMinutes = 0;

        if (wo.revision_window_expires_at) {
            const now = new Date();
            const expiresAt = new Date(wo.revision_window_expires_at);
            remainingHours = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
            remainingMinutes = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)) % 60;

            if (remainingHours < 2) {
                timeWarning = `Peringatan: Waktu tersisa kurang dari 2 jam (${remainingHours}j ${remainingMinutes}m)`;
            }
        }

        // Submit revision
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]
            || request.headers.get('x-real-ip')
            || 'unknown';

        const { data: revision, error: revisionError } = await supabase
            .from('work_order_revisions')
            .insert([{
                wo_id,
                requester_id: user.id,
                ...revisionData,
                status: 'pending',
                submitted_from_ip: clientIp,
                user_agent: request.headers.get('user-agent'),
            }])
            .select()
            .single();

        if (revisionError) {
            throw revisionError;
        }

        return NextResponse.json({
            success: true,
            revision,
            time_warning: timeWarning,
            remaining_time: {
                hours: remainingHours,
                minutes: remainingMinutes,
            },
        });

    } catch (error: any) {
        console.error('Revision submission error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal mengajukan revisi' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: 'Supabase configuration missing' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get ticket ID from query
        const searchParams = request.nextUrl.searchParams;
        const ticketId = searchParams.get('ticket_id');

        if (!ticketId) {
            return NextResponse.json(
                { error: 'Ticket ID required' },
                { status: 400 }
            );
        }

        // Check user access
        const { data: wo } = await supabase
            .from('work_orders')
            .select('user_id, status')
            .eq('id', ticketId)
            .single();

        if (!wo) {
            return NextResponse.json(
                { error: 'Work order not found' },
                { status: 404 }
            );
        }

        // Check if user has access
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const hasAccess = 
            wo.user_id === user.id || 
            ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile?.role || '');

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Get revisions
        const { data: revisions, error: revisionsError } = await supabase
            .from('work_order_revisions')
            .select('*')
            .eq('wo_id', ticketId)
            .order('created_at', { ascending: false });

        if (revisionsError) {
            throw revisionsError;
        }

        // Get revision count
        const revisionCount = revisions?.length || 0;

        return NextResponse.json({
            revisions: revisions || [],
            revision_count: revisionCount,
        });

    } catch (error: any) {
        console.error('Get revisions error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get revisions' },
            { status: 500 }
        );
    }
}
