import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    console.log("--- Auth Callback Debug ---");
    console.log("Full URL:", request.url);
    console.log("Params:", Object.fromEntries(searchParams.entries()));
    console.log("Supabase Env - URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL, "| Key:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()

        console.log("Auth Callback: Code received, exchanging for session...");
        console.log("Supabase URL present:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("Supabase Anon Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
                global: {
                    headers: {
                        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            console.log("Auth Callback: Success! Redirecting to", next);
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error("Auth Callback: Error exchanging code:", error.message);
    } else {
        console.warn("Auth Callback: No code found in searchParams");
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
