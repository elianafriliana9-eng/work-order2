import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    console.log('[Auth Callback] Starting. Origin:', origin, 'Has code:', !!code)

    if (!code) {
        console.error('[Auth Callback] No code provided')
        return NextResponse.redirect(new URL('/login?error=no_code', origin))
    }

    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options })
                        } catch (e) {
                            // Cookie setting might fail in some edge cases
                            console.error('[Auth Callback] Cookie set error:', e)
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options })
                        } catch (e) {
                            console.error('[Auth Callback] Cookie remove error:', e)
                        }
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('[Auth Callback] Exchange error:', error.message)
            return NextResponse.redirect(new URL('/login?error=exchange_failed', origin))
        }

        if (!data?.user) {
            console.error('[Auth Callback] No user returned after exchange')
            return NextResponse.redirect(new URL('/login?error=no_user', origin))
        }

        console.log('[Auth Callback] User authenticated:', data.user.id)

        // Determine redirect path based on role
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
            console.log('[Auth Callback] Role:', profile?.role, '-> Redirect to:', redirectPath)
        } catch (profileErr) {
            console.error('[Auth Callback] Profile fetch error (non-fatal):', profileErr)
            // Non-fatal: still redirect to dashboard
        }

        return NextResponse.redirect(new URL(redirectPath, origin))
    } catch (err) {
        console.error('[Auth Callback] Fatal error:', err)
        return NextResponse.redirect(new URL('/login?error=callback_exception', origin))
    }
}
