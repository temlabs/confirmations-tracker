import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

let browserClient: ReturnType<typeof createClient<Database>> | undefined

export function getSupabaseBrowserClient() {
    if (typeof window === 'undefined') {
        throw new Error('getSupabaseBrowserClient must be used in the browser')
    }
    if (!browserClient) {
        browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
    return browserClient
}
