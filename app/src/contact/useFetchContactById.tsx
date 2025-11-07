import {
    useQuery,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Contact = Tables<'contacts'>

export function useFetchContactById(
    id: string | null | undefined
): UseQueryResult<Contact | null, Error> {
    return useQuery<Contact | null, Error, Contact | null, QueryKey>({
        queryKey: ['contact', id ?? null],
        enabled: !!id,
        queryFn: async () => {
            if (!id) return null
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', id)
                .single()
            if (error) throw error
            return (data as Contact) ?? null
        },
    })
}
