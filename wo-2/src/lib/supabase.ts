import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only throw if we are in the browser (runtime) and env is missing
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    throw new Error('Supabase URL and Anon Key are required at runtime!')
}

export const supabase = createBrowserClient(
    supabaseUrl || 'https://build-time-dummy.supabase.co',
    supabaseAnonKey || 'build-time-dummy-key'
)
