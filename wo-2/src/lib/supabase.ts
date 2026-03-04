import { createBrowserClient } from '@supabase/ssr'

// Hardcode fixed values for production to avoid environment resolution issues
const supabaseUrl = 'https://ropwebyycwvsvdrbgnpn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcHdlYnl5Y3d2c3ZkcmJnbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTMxNDYsImV4cCI6MjA4NzU4OTE0Nn0.5VjxWZIed4027LDggBLk63xujPPuXpxoSbva2pkI5V8'

export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
)
