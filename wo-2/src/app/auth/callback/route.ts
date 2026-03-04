import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (code) {
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
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error && data?.user) {
            // Check for admin roles
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
            const redirectPath = isAdmin ? '/admin' : '/dashboard'

            // PENTING: Pakai URL absolut untuk redirect
            return NextResponse.redirect(`${origin}${redirectPath}`)
        }
    }

    // Balikin ke login kalau gagal
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
