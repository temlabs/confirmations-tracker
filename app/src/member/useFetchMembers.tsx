import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Member = Tables<'members'>

export type MembersFilter = {
    equals?: Partial<
        Pick<
            Member,
            'id' | 'bacenta_id' | 'first_name' | 'last_name' | 'full_name'
        >
    >
    in?: Partial<{ [K in keyof Member]: NonNullable<Member[K]>[] }>
    ilike?: Partial<Pick<Member, 'first_name' | 'last_name' | 'full_name'>>
    orderBy?: { column: keyof Member; ascending?: boolean }
    limit?: number
}

type FetchMembersOptions = Omit<
    UseQueryOptions<Member[], Error, Member[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchMembers(
    filters?: MembersFilter,
    config?: FetchMembersOptions
): UseQueryResult<Member[], Error> {
    return useQuery<Member[], Error, Member[], QueryKey>({
        queryKey: ['members', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase.from('members').select('*')

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof Member as string
                    if (value === null) {
                        // For null equality, Postgrest uses IS
                        query = query.is(column, null)
                    } else {
                        query = query.eq(column, value as never)
                    }
                }
            }

            if (filters?.in) {
                for (const [key, arr] of Object.entries(filters.in)) {
                    if (!arr || arr.length === 0) continue
                    const column = key as keyof Member as string
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.ilike) {
                for (const [key, pattern] of Object.entries(filters.ilike)) {
                    if (!pattern) continue
                    const column = key as keyof Member as string
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
