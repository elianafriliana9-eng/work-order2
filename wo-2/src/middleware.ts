import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Skip middleware logic if essential config is missing (e.g. during build)
    if (!supabaseUrl || !supabaseKey) {
        return response
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({ name, value, ...options })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({ name, value: '', ...options })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({ name, value: '', ...options })
                    },
                },
            }
        )

        // Refresh session and get user
        const { data: { user } } = await supabase.auth.getUser()

        const path = request.nextUrl.pathname
        const isAuthPage = path.startsWith('/login')
        const isAdminPage = path.startsWith('/admin')
        const isUserPage = path.startsWith('/dashboard') || path.startsWith('/new-ticket')

        // 1. Redirect to login if accessing internal pages without a session
        if ((isAdminPage || isUserPage) && !user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // 2. Redirect to correct dashboard if already logged in
        if (isAuthPage && user) {
            let target = '/dashboard'
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()

                if (profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)) {
                    target = '/admin'
                }
            } catch {
                // Ignore error, use default target
            }
            return NextResponse.redirect(new URL(target, request.url))
        }

        // 3. Prevent users from accessing admin pages
        if (isAdminPage && user) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()

                const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
                if (!isAdmin) {
                    return NextResponse.redirect(new URL('/dashboard', request.url))
                }
            } catch {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }

    } catch (err) {
        console.error('[Middleware] Unexpected error:', err)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (auth flow)
         * - landing page (handled by default)
         * - api routes (optional, let them handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|api|$).*)',
    ],
}
