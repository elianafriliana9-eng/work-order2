import { createBrowserClient } from '@supabase/ssr'

// Purely defensive check for build-time vs runtime
const getValidUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl;
  }
  // This value is ONLY used during build-time to prevent crashes.
  // At runtime, if env is set correctly in Vercel, it will use that.
  return 'https://ropwebyycwvsvdrbgnpn.supabase.co';
}

const getValidKey = () => {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (envKey && envKey.length > 10) {
    return envKey;
  }
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8';
}

export const supabase = createBrowserClient(
    getValidUrl(),
    getValidKey()
)
