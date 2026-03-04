import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error("Auth Callback: Missing environment variables.");
        return NextResponse.redirect(`${origin}/login?error=env_missing`)
    }

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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle()

                const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
                const redirectPath = isAdmin ? '/admin' : '/dashboard'

                return NextResponse.redirect(`${origin}${redirectPath}`)
            }
        } catch (err) {
            console.error("Auth exchange error:", err);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
