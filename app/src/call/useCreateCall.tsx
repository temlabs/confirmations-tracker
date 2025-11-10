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
            // Invalidate calls for specific confirmation (detail views)
            qc.invalidateQueries({
                queryKey: [
                    'calls',
                    {
                        confirmationId:
                            // keep query key shape for compatibility
                            (variables as any).callee_contact_id ?? null,
                    },
                ],
            })
            // Invalidate all calls lists (e.g., Telepastoring aggregates)
            qc.invalidateQueries({ queryKey: ['calls'] })
        },
    })
}
