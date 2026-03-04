import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// This pattern is optimized for Next.js 16/Turbopack build vs runtime.
// It provides a dummy URL only during the static build phase to prevent crashes,
// ensuring the actual client-side bundle uses the correct environment variables.
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
