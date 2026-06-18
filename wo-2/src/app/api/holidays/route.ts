import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let query = supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

    if (year) {
        query = query.eq('year', parseInt(year));
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ holidays: data || [] });
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { error } = await supabase.from('holidays').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { date, name, description } = await request.json();
        if (!date || !name) {
            return NextResponse.json({ error: 'Date and name are required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { data, error } = await supabase
            .from('holidays')
            .insert({ date, name, description: description || name, source: 'manual' })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ holiday: data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
