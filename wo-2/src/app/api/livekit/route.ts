import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    try {
        const room = req.nextUrl.searchParams.get('room');
        const username = req.nextUrl.searchParams.get('username');
        const userId = req.nextUrl.searchParams.get('userId');

        if (!room || !username || !userId) {
            console.error("Missing query params:", { room, username, userId });
            return NextResponse.json(
                { error: 'Missing "room", "username", or "userId" query parameter' },
                { status: 400 }
            );
        }

        // Initialize Supabase Client only when needed
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Supabase configuration missing in API route");
            return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
            console.error("LiveKit misconfiguration: Missing env variables.", { hasApiKey: !!apiKey, hasApiSecret: !!apiSecret, hasWsUrl: !!wsUrl });
            return NextResponse.json(
                { error: 'Server is not configured for LiveKit' },
                { status: 500 }
            );
        }

        // Optional: Add logic here to verify ticket ownership via Supabase if needed
        // const { data: ticket } = await supabase.from('work_orders').select('*').eq('id', room.replace('ticket-', '')).single();

        const at = new AccessToken(apiKey, apiSecret, {
            identity: userId,
            name: username,
            ttl: '1h',
        });

        at.addGrant({
            room,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        });

        return NextResponse.json({ token: await at.toJwt() });
    } catch (error: any) {
        console.error('Error generating LiveKit token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
