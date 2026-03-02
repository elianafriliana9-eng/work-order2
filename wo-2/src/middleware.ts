import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return response;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL.trim(),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim(),
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // This will refresh session if expired - essential for SSR
    const { data: { user } } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname.startsWith('/login')
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
    const isInternalPage = request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/new-ticket') ||
        isAdminPage

    // 1. Unauthenticated users cannot access internal pages
    if (isInternalPage && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Authenticated users cannot access auth pages
    if (isAuthPage && user) {
        let redirectPath = '/dashboard'

        // Check if admin from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)) {
            redirectPath = '/admin'
        }

        const url = request.nextUrl.clone()
        url.pathname = redirectPath
        return NextResponse.redirect(url)
    }

    // 3. Strict Admin Access Control (IDOR/Access Guard)
    if (isAdminPage && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)

        if (!isAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (auth flow)
         */
        '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
    ],
}
