import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    console.log("[Auth Callback] Request received:", request.url)
    console.log("[Auth Callback] Code present:", !!code)
    console.log("[Auth Callback] Origin determined:", origin)

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ropwebyycwvsvdrbgnpn.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8',
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
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
            console.error("[Auth Callback] Exchange Error:", error.message)
        }

        if (!error && data?.user) {
            console.log("[Auth Callback] User Authenticated:", data.user.id)
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle()

            console.log("[Auth Callback] Profile Role:", profile?.role)

            const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
            const redirectPath = isAdmin ? '/admin' : '/dashboard'

            console.log("[Auth Callback] Redirecting to:", redirectPath)
            const response = NextResponse.redirect(new URL(redirectPath, origin).toString())
            return response
        }
    }

    console.warn("[Auth Callback] No code or user found, redirecting to login")
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin).toString())
}
