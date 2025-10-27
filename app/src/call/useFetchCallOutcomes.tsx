import {
    useQuery,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Outcome = Tables<'call_outcomes'>

export function useFetchCallOutcomes(): UseQueryResult<Outcome[], Error> {
    return useQuery<Outcome[], Error, Outcome[], QueryKey>({
        queryKey: ['call_outcomes'],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('call_outcomes')
                .select('*')
                .order('description', { ascending: true })
            if (error) throw error
            return (data ?? []) as Outcome[]
        },
        staleTime: 5 * 60 * 1000,
    })
}
