import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Determine the redirect origin. Fallback to production if detection is wonky.
    const origin = requestUrl.origin.includes('localhost') 
        ? requestUrl.origin 
        : 'https://digitalteamsrt.com'

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=no_code`)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('[Auth Callback] Missing environment variables')
        return NextResponse.redirect(`${origin}/login?error=env_missing`)
    }

    try {
        const cookieStore = await cookies()
        const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
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
            console.error('[Auth Callback] Session exchange failed:', error?.message)
            return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
        }

        // Determine target dashboard based on user role
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
        } catch (profileErr) {
            console.error('[Auth Callback] Role check failed:', profileErr)
        }

        // Construct the final response
        const response = NextResponse.redirect(`${origin}${redirectPath}`)

        // Manually apply auth cookies to the redirect response
        cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })

        return response
    } catch (fatalErr) {
        console.error('[Auth Callback] Fatal exception:', fatalErr)
        return NextResponse.redirect(`${origin}/login?error=fatal`)
    }
}
