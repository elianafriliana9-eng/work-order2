import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

let _client: ReturnType<typeof createBrowserClient> | null = null

function getClient() {
    if (!_client) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            const error = new Error('Supabase public environment variables are missing')
            error.name = 'SupabaseConfigurationError'
            throw error
        }
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
