import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Bacenta = Tables<'bacentas'>

export type BacentasFilter = {
    equals?: Partial<Pick<Bacenta, 'id' | 'name'>>
    ilike?: Partial<Pick<Bacenta, 'name'>>
    orderBy?: { column: keyof Bacenta; ascending?: boolean }
    limit?: number
}

type FetchBacentasOptions = Omit<
    UseQueryOptions<Bacenta[], Error, Bacenta[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchBacentas(
    filters?: BacentasFilter,
    config?: FetchBacentasOptions
): UseQueryResult<Bacenta[], Error> {
    return useQuery<Bacenta[], Error, Bacenta[], QueryKey>({
        queryKey: ['bacentas', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('bacentas').select('*')

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof Bacenta as string
                    if (value === null) {
                        query = query.is(column, null)
                    } else {
                        query = query.eq(column, value as never)
                    }
                }
            }

            if (filters?.ilike) {
                for (const [key, pattern] of Object.entries(filters.ilike)) {
                    if (!pattern) continue
                    const column = key as keyof Bacenta as string
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
