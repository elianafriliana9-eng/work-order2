import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const before = searchParams.get('before'); // cursor for pagination

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let query = supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: (data || []).reverse() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sender_id, sender_name, sender_role, message } = body;

  if (!sender_id || !sender_role || !message?.trim()) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  if (!['head_it', 'designer'].includes(sender_role)) {
    return NextResponse.json(
      { error: 'Unauthorized role' },
      { status: 403 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sender_id,
      sender_name: sender_name || '',
      sender_role,
      message: message.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}
