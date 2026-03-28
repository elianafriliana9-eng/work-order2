import { createBrowserClient } from '@supabase/ssr'

// NEXT_PUBLIC_ vars are inlined at build time by Next.js.
// If not set in Vercel dashboard, we use production defaults.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ropwebyycwvsvdrbgnpn.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8'

let _client: ReturnType<typeof createBrowserClient> | null = null

function getClient() {
    if (!_client) {
        _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    }
    return _client
}

// Export as a getter that lazily creates the client on first use
// This prevents crashes during Vercel's SSR prerendering phase
export const supabase = {
    get auth() { return getClient().auth },
    get storage() { return getClient().storage },
    from(table: string) { return getClient().from(table) },
    rpc(fn: string, params?: any) { return getClient().rpc(fn, params) },
    channel(name: string) { return getClient().channel(name) },
    removeChannel(channel: any) { return getClient().removeChannel(channel) },
}
