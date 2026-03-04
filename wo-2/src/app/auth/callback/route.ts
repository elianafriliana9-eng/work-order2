import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Explicitly determine the redirect origin
    const origin = requestUrl.origin.includes('localhost') 
        ? requestUrl.origin 
        : 'https://digitalteamsrt.com'

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=no_code`)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://ropwebyycwvsvdrbgnpn.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8'

    try {
        const cookieStore = await cookies()
        
        // This is the most reliable way to handle cookies in Next.js 16 Route Handlers
        const response = NextResponse.redirect(`${origin}/dashboard`) // Default target

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                        response.cookies.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                        response.cookies.set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error || !data?.user) {
            console.error('[Auth Callback] Exchange failed:', error?.message)
            return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
        }

        // Determine correct redirect path based on user role
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
            console.error('[Auth Callback] Profile fetch failed:', profileErr)
        }

        // Create the final redirect response and ensure cookies are carried over
        const finalResponse = NextResponse.redirect(`${origin}${redirectPath}`)
        
        // Transfer cookies from the temporary 'response' object to the final one
        response.cookies.getAll().forEach((cookie) => {
            finalResponse.cookies.set(cookie.name, cookie.value, cookie)
        })

        return finalResponse
    } catch (fatalErr) {
        console.error('[Auth Callback] Fatal error:', fatalErr)
        return NextResponse.redirect(`${origin}/login?error=fatal`)
    }
}
