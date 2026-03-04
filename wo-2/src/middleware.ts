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

    // Defensive check to prevent middleware crash if env is missing
    if (!supabaseUrl || !supabaseKey) {
        console.error("Middleware: Supabase environment variables are missing!");
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

        // Important: Safe session check
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        const isAuthPage = request.nextUrl.pathname.startsWith('/login')
        const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
        const isInternalPage = request.nextUrl.pathname.startsWith('/dashboard') ||
            request.nextUrl.pathname.startsWith('/new-ticket') ||
            isAdminPage

        if (isInternalPage && !user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        if (isAuthPage && user) {
            let redirectPath = '/dashboard'
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            if (profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)) {
                redirectPath = '/admin'
            }
            const url = request.nextUrl.clone()
            url.pathname = redirectPath
            return NextResponse.redirect(url)
        }

        if (isAdminPage && user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()
            const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
            if (!isAdmin) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }
    } catch (e) {
        console.error("Middleware execution failed:", e);
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
         * - api (api routes)
         */
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|api).*)',
    ],
}
