import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesInsert } from '~/types/database.types'

type Call = Tables<'calls'>

export function useCreateCall() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: TablesInsert<'calls'>) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('calls')
                .insert(payload)
                .select('*')
                .single()
            if (error) throw error
            return data as Call
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({
                queryKey: [
                    'calls',
                    {
                        confirmationId:
                            variables.callee_confirmation_id ?? null,
                    },
                ],
            })
        },
    })
}
