import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// createBrowserClient is designed to be safe during build, 
// but we provide placeholders just in case to prevent "Invalid URL" crashes.
export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
)
