import { createBrowserClient } from '@supabase/ssr'

// Extreme defense for Next.js 16 build time pruning
const getEnv = (key: string, fallback: string) => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder');

export const supabase = createBrowserClient(
  supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey
)
