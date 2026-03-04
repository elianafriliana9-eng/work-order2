import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ropwebyycwvsvdrbgnpn.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8'

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=no_code`)
    }

    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}/dashboard`) // Default

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

    try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error && data?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle()

            const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
            const finalRedirect = isAdmin ? `${origin}/admin` : `${origin}/dashboard`
            
            // Create a NEW redirect response with the correct path
            const finalResponse = NextResponse.redirect(finalRedirect)
            
            // Sync cookies from the temporary response to the final one
            response.cookies.getAll().forEach(cookie => {
                finalResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            
            return finalResponse
        }
    } catch (err) {
        console.error("Auth callback fatal error:", err)
    }

    return NextResponse.redirect(`${origin}/login?error=callback_failed`)
}
