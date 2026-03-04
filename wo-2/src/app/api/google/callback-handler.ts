import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log("--- GOOGLE TOKENS RECEIVED ---");
        console.log("Access Token:", tokens.access_token);
        console.log("Refresh Token:", tokens.refresh_token); // This is what we need for long term
        console.log("------------------------------");

        return NextResponse.json({ 
            message: 'Authorization Successful!', 
            hint: 'Refresh token printed to server logs. Add it to .env as GOOGLE_REFRESH_TOKEN',
            refresh_token: tokens.refresh_token 
        });
    } catch (error: any) {
        console.error("Google Auth Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
