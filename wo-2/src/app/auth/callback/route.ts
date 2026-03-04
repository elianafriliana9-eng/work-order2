import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const origin = 'https://digitalteamsrt.com'
    
    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            'https://ropwebyycwvsvdrbgnpn.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8',
            {
                cookies: {
                    async get(name: string) {
                        return (await cookieStore).get(name)?.value
                    },
                    async set(name: string, value: string, options: CookieOptions) {
                        (await cookieStore).set({ name, value, ...options })
                    },
                    async remove(name: string, options: CookieOptions) {
                        (await cookieStore).set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error && data?.user) {
            // Get user profile to check role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle()

            console.log("Auth Callback: User ID", data.user.id, "Profile Role:", profile?.role);

            // Correctly determine redirect path based on role
            const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
            const redirectPath = isAdmin ? '/admin' : '/dashboard'

            console.log("Auth Callback: Redirecting to", redirectPath);
            return NextResponse.redirect(`${origin}${redirectPath}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
