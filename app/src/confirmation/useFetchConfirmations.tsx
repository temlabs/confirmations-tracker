import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

export type ConfirmationsFilter = {
    equals?: Partial<
        Pick<
            Confirmation,
            | 'id'
            | 'event_id'
            | 'confirmed_by_member_id'
            | 'first_name'
            | 'last_name'
            | 'contact_number'
            | 'attended'
            | 'is_first_time'
            | 'created_at'
        >
    >
    in?: Partial<{ [K in keyof Confirmation]: NonNullable<Confirmation[K]>[] }>
    ilike?: Partial<
        Pick<Confirmation, 'first_name' | 'last_name' | 'contact_number'>
    >
    range?: {
        created_at?: { gte?: string; lte?: string }
    }
    orderBy?:
        | { column: keyof Confirmation; ascending?: boolean }
        | Array<{ column: keyof Confirmation; ascending?: boolean }>
    limit?: number
}

type FetchConfirmationsOptions = Omit<
    UseQueryOptions<Confirmation[], Error, Confirmation[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchConfirmations(
    filters?: ConfirmationsFilter,
    config?: FetchConfirmationsOptions
): UseQueryResult<Confirmation[], Error> {
    return useQuery<Confirmation[], Error, Confirmation[], QueryKey>({
        queryKey: ['confirmations', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('confirmations').select('*')

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof Confirmation as string
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
                    const column = key as keyof Confirmation as string
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.ilike) {
                for (const [key, pattern] of Object.entries(filters.ilike)) {
                    if (!pattern) continue
                    const column = key as keyof Confirmation as string
                    query = query.ilike(column, pattern as string)
                }
            }

            if (filters?.range?.created_at) {
                const { gte, lte } = filters.range.created_at
                if (gte) query = query.gte('created_at', gte)
                if (lte) query = query.lte('created_at', lte)
            }

            if (filters?.orderBy) {
                const orderBys = Array.isArray(filters.orderBy)
                    ? filters.orderBy
                    : [filters.orderBy]
                for (const { column, ascending = true } of orderBys) {
                    query = query.order(column as string, { ascending })
                }
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
