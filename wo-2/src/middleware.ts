import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Robust environment variable resolution
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://ropwebyycwvsvdrbgnpn.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8'

    // Final safety check for valid URL format
    if (!supabaseUrl.startsWith('http')) {
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
                        response.cookies.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({ name, value: '', ...options })
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

        if ((isAdminPage || isUserPage) && !user) {
            const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
            // Copy cookies from our local response to the redirect response
            response.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value, {
                    ...cookie,
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production'
                })
            })
            return redirectResponse
        }

        if (isAuthPage && user) {
            let target = '/dashboard'
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            if (profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)) {
                target = '/admin'
            }
            const redirectResponse = NextResponse.redirect(new URL(target, request.url))
            response.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value, {
                    ...cookie,
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production'
                })
            })
            return redirectResponse
        }

        if (isAdminPage && user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
            if (!isAdmin) {
                const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
                response.cookies.getAll().forEach(cookie => {
                    redirectResponse.cookies.set(cookie.name, cookie.value, {
                        ...cookie,
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production'
                    })
                })
                return redirectResponse
            }
        }

    } catch (err) {
        console.error('[Middleware Error]', err)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|api|$).*)',
    ],
}
