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
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle()

            const isAdmin = profile && ['head_it', 'designer', 'it_dev', 'it_support'].includes(profile.role)
            const redirectPath = isAdmin ? '/admin' : '/dashboard'

            return NextResponse.redirect(`${origin}${redirectPath}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
