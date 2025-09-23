import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Event = Tables<'events'>

export type EventsFilter = {
    equals?: Partial<
        Pick<
            Event,
            | 'id'
            | 'name'
            | 'event_timestamp'
            | 'overall_attendee_target'
            | 'total_attendees'
            | 'total_confirmations'
            | 'created_at'
            | 'updated_at'
        >
    >
    in?: Partial<{ [K in keyof Event]: NonNullable<Event[K]>[] }>
    ilike?: Partial<Pick<Event, 'name' | 'id'>>
    orderBy?: { column: keyof Event; ascending?: boolean }
    limit?: number
}

type FetchEventsOptions = Omit<
    UseQueryOptions<Event[], Error, Event[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchEvents(
    filters?: EventsFilter,
    config?: FetchEventsOptions
): UseQueryResult<Event[], Error> {
    return useQuery<Event[], Error, Event[], QueryKey>({
        queryKey: ['events', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('events').select('*')

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof Event as string
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
                    const column = key as keyof Event as string
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.ilike) {
                for (const [key, pattern] of Object.entries(filters.ilike)) {
                    if (!pattern) continue
                    const column = key as keyof Event as string
                    query = query.ilike(column, pattern as string)
                }
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
