import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const HOLIDAY_API = 'https://api-hari-libur.vercel.app/api';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const { year } = await request.json();

        if (!year || typeof year !== 'number') {
            return NextResponse.json({ error: 'Year is required (e.g. 2026)' }, { status: 400 });
        }

        const response = await fetch(`${HOLIDAY_API}?year=${year}`);
        if (!response.ok) {
            return NextResponse.json({ error: `Holiday API returned ${response.status}` }, { status: 502 });
        }

        const result = await response.json();
        if (result.status !== 'success' || !Array.isArray(result.data)) {
            return NextResponse.json({ error: 'Invalid response from holiday API' }, { status: 502 });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        let synced = 0;
        let skipped = 0;

        for (const item of result.data) {
            const { error } = await supabase.from('holidays').upsert(
                {
                    date: item.date,
                    name: item.description,
                    description: item.description,
                    source: 'api-hari-libur',
                },
                {
                    onConflict: 'date',
                    ignoreDuplicates: false,
                }
            );

            if (error) {
                skipped++;
            } else {
                synced++;
            }
        }

        return NextResponse.json({
            success: true,
            year,
            synced,
            skipped,
            total: result.data.length,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
