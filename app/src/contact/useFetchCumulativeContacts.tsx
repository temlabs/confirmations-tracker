import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'

type CumulativeRow = Tables<'event_cumulative_view'>

export type CumulativeContactsFilter = {
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
> & {
    /** When true (default), scope to current event unless filters already specify event_id */
    scopeToCurrentEvent?: boolean
}

export function useFetchCumulativeContacts(
    filters?: CumulativeContactsFilter,
    config?: FetchCumulativeOptions
): UseQueryResult<CumulativeRow[], Error> {
    const { event } = useFetchCurrentEvent()
    const shouldScope =
        (config?.scopeToCurrentEvent ?? true) &&
        !(filters && filters.equals && 'event_id' in filters.equals)

    const finalFilters: CumulativeContactsFilter | undefined =
        shouldScope && event
            ? {
                  ...filters,
                  equals: { ...(filters?.equals ?? {}), event_id: event.id },
              }
            : filters

    const effectiveEnabled =
        (config?.enabled ?? true) && (!shouldScope || !!event)

    return useQuery<CumulativeRow[], Error, CumulativeRow[], QueryKey>({
        queryKey: ['event_cumulative_view', finalFilters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('event_cumulative_view').select('*')

            if (finalFilters?.equals) {
                for (const [key, value] of Object.entries(
                    finalFilters.equals
                )) {
                    if (value === undefined) continue
                    const column = key as keyof CumulativeRow as string
                    if (value === null) {
                        query = query.is(column, null)
                    } else {
                        query = query.eq(column, value as never)
                    }
                }
            }

            if (finalFilters?.in) {
                for (const [key, arr] of Object.entries(finalFilters.in)) {
                    if (!arr || arr.length === 0) continue
                    const column = key as keyof CumulativeRow as string
                    query = query.in(column, arr as never[])
                }
            }

            if (finalFilters?.range?.day) {
                const { gte, lte } = finalFilters.range.day
                if (gte) query = query.gte('day', gte)
                if (lte) query = query.lte('day', lte)
            }

            if (finalFilters?.orderBy) {
                const { column, ascending = true } = finalFilters.orderBy
                query = query.order(column as string, { ascending })
            }

            if (typeof finalFilters?.limit === 'number') {
                query = query.limit(finalFilters.limit)
            }

            const { data, error } = await query
            if (error) throw error

            return data ?? []
        },
        ...(config ?? {}),
        enabled: effectiveEnabled,
    })
}
