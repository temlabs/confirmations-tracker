import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type CumulativeRow = Tables<'event_cumulative_view'>

export type CumulativeConfirmationsFilter = {
    equals?: Partial<
        Pick<CumulativeRow, 'event_id' | 'day' | 'cumulative_confirmations'>
    >
    in?: Partial<{
        [K in keyof CumulativeRow]: NonNullable<CumulativeRow[K]>[]
    }>
    range?: {
        day?: { gte?: string; lte?: string }
    }
    orderBy?: { column: keyof CumulativeRow; ascending?: boolean }
    limit?: number
}

type FetchCumulativeOptions = Omit<
    UseQueryOptions<CumulativeRow[], Error, CumulativeRow[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchCumulativeConfirmations(
    filters?: CumulativeConfirmationsFilter,
    config?: FetchCumulativeOptions
): UseQueryResult<CumulativeRow[], Error> {
    return useQuery<CumulativeRow[], Error, CumulativeRow[], QueryKey>({
        queryKey: ['event_cumulative_view', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('event_cumulative_view').select('*')

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof CumulativeRow as string
                    if (value === null) {
                        query = query.is(column, null)
                    } else {
                        query = query.eq(column, value as never)
                    }
                }
            }

            if (filters?.in) {
                for (const [key, arr] of Object.entries(filters.in)) {
                    if (!arr || arr.length === 0) continue
                    const column = key as keyof CumulativeRow as string
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.range?.day) {
                const { gte, lte } = filters.range.day
                if (gte) query = query.gte('day', gte)
                if (lte) query = query.lte('day', lte)
            }

            if (filters?.orderBy) {
                const { column, ascending = true } = filters.orderBy
                query = query.order(column as string, { ascending })
            }

            if (typeof filters?.limit === 'number') {
                query = query.limit(filters.limit)
            }

            const { data, error } = await query
            if (error) throw error

            return data ?? []
        },
        ...config,
    })
}
