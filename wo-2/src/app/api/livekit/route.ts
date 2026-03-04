import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

// Setup admin client to bypass RLS since this is a server route and we might need to check tickets
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Disini kita sebaiknya pake service_role_key kalau ada, tapi sementara test pakai anon
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
    try {
        const room = req.nextUrl.searchParams.get('room');
        const username = req.nextUrl.searchParams.get('username');

        if (!room || !username) {
            return NextResponse.json(
                { error: 'Missing "room" or "username" query parameter' },
                { status: 400 }
            );
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
            return NextResponse.json(
                { error: 'Server is not configured for LiveKit' },
                { status: 500 }
            );
        }

        // You can add logic here to check if the ticket exists and if the user is authorized.
        // For now, we will just mint a token for the requested room.

        const at = new AccessToken(apiKey, apiSecret, {
            identity: username,
            // Optional: Set time to live for the token
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
