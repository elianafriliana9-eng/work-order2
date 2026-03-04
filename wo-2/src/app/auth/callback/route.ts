import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    
    // Fallback if environment variables are not detected during the request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ropwebyycwvsvdrbgnpn.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8'

    if (code) {
        const cookieStore = await cookies()

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
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (!error && data?.user) {
                // Determine if user has admin privileges
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle()

                const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
                const redirectPath = isAdmin ? '/admin' : '/dashboard'

                // Using absolute URL for redirect to avoid blank page issues in Next.js 16/Vercel
                return NextResponse.redirect(new URL(redirectPath, origin).toString())
            }
        } catch (err) {
            console.error("Auth callback exception:", err);
        }
    }

    // Default error redirect
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin).toString())
}
