import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'

type Contact = Tables<'contacts'>

export type ContactsFilter = {
    equals?: Partial<
        Pick<
            Contact,
            | 'id'
            | 'event_id'
            | 'contacted_by_member_id'
            | 'first_name'
            | 'last_name'
            | 'contact_number'
            | 'attended'
            | 'is_first_time'
            | 'created_at'
        >
    >
    in?: Partial<{ [K in keyof Contact]: NonNullable<Contact[K]>[] }>
    ilike?: Partial<
        Pick<Contact, 'first_name' | 'last_name' | 'contact_number'>
    >
    range?: {
        created_at?: { gte?: string; lte?: string }
    }
    orderBy?:
        | { column: keyof Contact; ascending?: boolean }
        | Array<{ column: keyof Contact; ascending?: boolean }>
    limit?: number
}

type FetchContactsOptions = Omit<
    UseQueryOptions<Contact[], Error, Contact[], QueryKey>,
    'queryKey' | 'queryFn'
> & {
    /**
     * When true (default), automatically scopes results to the currently selected event
     * unless an explicit equals.event_id is provided in filters.
     */
    scopeToCurrentEvent?: boolean
}

export function useFetchContacts(
    filters?: ContactsFilter,
    config?: FetchContactsOptions
): UseQueryResult<Contact[], Error> {
    const { event } = useFetchCurrentEvent()
    const shouldScope =
        (config?.scopeToCurrentEvent ?? true) &&
        !(filters && filters.equals && 'event_id' in filters.equals)

    const finalFilters: ContactsFilter | undefined =
        shouldScope && event
            ? {
                  ...filters,
                  equals: { ...(filters?.equals ?? {}), event_id: event.id },
              }
            : filters

    const effectiveEnabled =
        (config?.enabled ?? true) && (!shouldScope || !!event)

    return useQuery<Contact[], Error, Contact[], QueryKey>({
        queryKey: ['contacts', finalFilters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('contacts').select('*')

            if (finalFilters?.equals) {
                for (const [key, value] of Object.entries(
                    finalFilters.equals
                )) {
                    if (value === undefined) continue
                    const column = key as keyof Contact as string
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
                    const column = key as keyof Contact as string
                    query = query.in(column, arr as never[])
                }
            }

            if (finalFilters?.ilike) {
                for (const [key, pattern] of Object.entries(
                    finalFilters.ilike
                )) {
                    if (!pattern) continue
                    const column = key as keyof Contact as string
                    query = query.ilike(column, pattern as string)
                }
            }

            if (finalFilters?.range?.created_at) {
                const { gte, lte } = finalFilters.range.created_at
                if (gte) query = query.gte('created_at', gte)
                if (lte) query = query.lte('created_at', lte)
            }

            if (finalFilters?.orderBy) {
                const orderBys = Array.isArray(finalFilters.orderBy)
                    ? finalFilters.orderBy
                    : [finalFilters.orderBy]
                for (const { column, ascending = true } of orderBys) {
                    query = query.order(column as string, { ascending })
                }
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
