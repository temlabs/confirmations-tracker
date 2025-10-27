import {
    useQuery,
    type QueryKey,
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

export function useFetchCallsByConfirmation(
    confirmationId: string | null | undefined
): UseQueryResult<CallWithJoins[], Error> {
    return useQuery<CallWithJoins[], Error, CallWithJoins[], QueryKey>({
        queryKey: ['calls', { confirmationId: confirmationId ?? null }],
        enabled: !!confirmationId,
        queryFn: async () => {
            if (!confirmationId) return []
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('calls')
                .select(
                    '*, members!calls_caller_member_id_fkey(id, first_name, last_name, full_name), call_outcomes!calls_outcome_id_fkey(id, description, is_successful)'
                )
                .eq('callee_confirmation_id', confirmationId)
                .order('updated_at', { ascending: false })
            if (error) throw error
            const rows = (data ?? []) as any[]
            return rows.map((r) => ({
                ...(r as Call),
                caller: r.members ?? null,
                outcome: r.call_outcomes ?? null,
            })) as CallWithJoins[]
        },
    })
}
