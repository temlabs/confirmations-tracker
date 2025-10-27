import {
    useQuery,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

export function useFetchConfirmationById(
    id: string | null | undefined
): UseQueryResult<Confirmation | null, Error> {
    return useQuery<Confirmation | null, Error, Confirmation | null, QueryKey>({
        queryKey: ['confirmation', id ?? null],
        enabled: !!id,
        queryFn: async () => {
            if (!id) return null
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('confirmations')
                .select('*')
                .eq('id', id)
                .single()
            if (error) throw error
            return (data as Confirmation) ?? null
        },
    })
}
