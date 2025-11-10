import {
    useQuery,
    type QueryKey,
    type UseQueryOptions,
    type UseQueryResult,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Call = Tables<'calls'>
type Member = Tables<'members'>
type Outcome = Tables<'call_outcomes'>

export type CallWithJoins = Call & {
    caller?: Pick<
        Member,
        'id' | 'first_name' | 'last_name' | 'full_name'
    > | null
    outcome?: Pick<Outcome, 'id' | 'description' | 'is_successful'> | null
}

export type CallsFilter = {
    in?: Partial<{ [K in keyof Call]: NonNullable<Call[K]>[] }>
    equals?: Partial<
        Pick<Call, 'caller_member_id' | 'outcome_id' | 'callee_contact_id'>
    >
    range?: {
        call_timestamp?: {
            gte?: string
            lte?: string
        }
    }
    orderBy?: { column: keyof Call; ascending?: boolean }
    limit?: number
}

type FetchCallsOptions = Omit<
    UseQueryOptions<CallWithJoins[], Error, CallWithJoins[], QueryKey>,
    'queryKey' | 'queryFn'
>

export function useFetchCalls(
    filters?: CallsFilter,
    config?: FetchCallsOptions
): UseQueryResult<CallWithJoins[], Error> {
    return useQuery<CallWithJoins[], Error, CallWithJoins[], QueryKey>({
        queryKey: ['calls', filters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            let query = supabase
                .from('calls')
                .select(
                    '*, members!calls_caller_member_id_fkey(id, first_name, last_name, full_name), call_outcomes!calls_outcome_id_fkey(id, description, is_successful)'
                )

            if (filters?.equals) {
                for (const [key, value] of Object.entries(filters.equals)) {
                    if (value === undefined) continue
                    const column = key as keyof Call as string
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
                    const column = key as keyof Call as string
                    query = query.in(column, arr as never[])
                }
            }

            if (filters?.range?.call_timestamp) {
                const { gte, lte } = filters.range.call_timestamp
                if (gte) query = query.gte('call_timestamp', gte)
                if (lte) query = query.lte('call_timestamp', lte)
            }

            if (filters?.orderBy) {
                const { column, ascending = false } = filters.orderBy
                query = query.order(column as string, { ascending })
            } else {
                query = query.order('call_timestamp', { ascending: false })
            }

            if (typeof filters?.limit === 'number') {
                query = query.limit(filters.limit)
            }

            const { data, error } = await query
            if (error) throw error
            const rows = (data ?? []) as any[]
            return rows.map((r) => ({
                ...(r as Call),
                caller: r.members ?? null,
                outcome: r.call_outcomes ?? null,
            })) as CallWithJoins[]
        },
        staleTime: 60 * 1000,
        ...config,
    })
}
