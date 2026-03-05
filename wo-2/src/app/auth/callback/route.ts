import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=no_code', origin))
    }

    try {
        const cookieStore = await cookies()

        // CRITICAL: Collect cookies during exchange to apply on redirect response
        const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ropwebyycwvsvdrbgnpn.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8',
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // DO NOT use cookieStore.set() here - it won't persist on redirect!
                        // Instead, collect and apply to the response object later.
                        cookiesToSet.push({ name, value, options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookiesToSet.push({ name, value: '', options: { ...options, maxAge: 0 } })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error || !data?.user) {
            console.error('[Auth Callback] Exchange failed:', error?.message)
            return NextResponse.redirect(new URL('/login?error=exchange_failed', origin))
        }

        // Determine redirect based on role
        let redirectPath = '/dashboard'
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle()

        if (profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)) {
            redirectPath = '/admin'
        }

        // Create redirect and APPLY ALL collected cookies to the response
        const response = NextResponse.redirect(new URL(redirectPath, origin))
        for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options)
        }

        return response
    } catch (err) {
        console.error('[Auth Callback] Fatal:', err)
        return NextResponse.redirect(new URL('/login?error=exception', origin))
    }
}
