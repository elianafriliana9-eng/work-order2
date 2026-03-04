import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// This helper ensures we don't crash the build process when env variables are missing.
// Next.js 16/Turbopack is very aggressive with pre-rendering.
const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    // Return a dummy client during build to prevent "Invalid URL" errors
    console.warn("Supabase URL is missing or invalid. Using dummy client for build/SSR.");
    return createBrowserClient(
      'https://placeholder-build-only.supabase.co',
      'placeholder-key'
    )
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey!)
}

export const supabase = getSupabaseClient()
