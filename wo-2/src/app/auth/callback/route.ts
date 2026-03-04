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

        // Collect cookies that need to be set on the final redirect response
        const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Store cookies to apply them on the redirect response later
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
            return NextResponse.redirect(new URL('/login?error=exchange_failed', origin))
        }

        // Determine redirect path
        let redirectPath = '/dashboard'
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle()

            if (profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)) {
                redirectPath = '/admin'
            }
        } catch {
            // Non-fatal, default to /dashboard
        }

        // Create redirect response and SET ALL COOKIES on it
        const response = NextResponse.redirect(new URL(redirectPath, origin))

        for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options)
        }

        return response
    } catch (err) {
        console.error('[Auth Callback] Fatal:', err)
        return NextResponse.redirect(new URL('/login?error=callback_exception', origin))
    }
}
