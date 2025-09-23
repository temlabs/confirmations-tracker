import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type BacentaTargetsRow = Tables<'event_bacenta_targets_view'>

export type BacentaTargetsFilter = {
    equals?: Partial<
        Pick<
            BacentaTargetsRow,
            | 'event_id'
            | 'bacenta_id'
            | 'confirmations_target'
            | 'attendance_target'
            | 'total_confirmations'
            | 'total_attendees'
        >
    >
    in?: Partial<{
        [K in keyof BacentaTargetsRow]: NonNullable<BacentaTargetsRow[K]>[]
    }>
    orderBy?: { column: keyof BacentaTargetsRow; ascending?: boolean }
    limit?: number
}

type FetchBacentaTargetsOptions = Omit<
    UseQueryOptions<
        (BacentaTargetsRow & { bacenta_name?: string | null })[],
        Error,
        (BacentaTargetsRow & { bacenta_name?: string | null })[],
        QueryKey
    >,
    'queryKey' | 'queryFn'
> & {
    includeBacentaName?: boolean
}

export function useFetchBacentaTargets(
    filters?: BacentaTargetsFilter,
    config?: FetchBacentaTargetsOptions
): UseQueryResult<
    (BacentaTargetsRow & { bacenta_name?: string | null })[],
    Error
> {
    return useQuery<
        (BacentaTargetsRow & { bacenta_name?: string | null })[],
        Error,
        (BacentaTargetsRow & { bacenta_name?: string | null })[],
        QueryKey
    >({
        queryKey: ['event_bacenta_targets_view', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            const select = config?.includeBacentaName
                ? '*, bacentas(name,id)'
                : '*'
            let query = supabase
                .from('event_bacenta_targets_view')
                .select(select)

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof BacentaTargetsRow as string
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
                    const column = key as keyof BacentaTargetsRow as string
                    query = query.in(column, arr as never[])
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

            if (!data) return []
            if (!config?.includeBacentaName)
                return data as unknown as (BacentaTargetsRow & {
                    bacenta_name?: string | null
                })[]

            // Map nested bacentas.name to bacenta_name for easier consumption
            const mapped = (data as unknown as Array<any>).map((row) => ({
                ...(row as BacentaTargetsRow),
                bacenta_name: row?.bacentas?.name ?? null,
            }))
            return mapped
        },
        ...config,
    })
}
