import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesUpdate } from '~/types/database.types'

type Call = Tables<'calls'>

export function useUpdateCall() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string
            updates: TablesUpdate<'calls'>
        }) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('calls')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()
            if (error) throw error
            return data as Call
        },
        onSuccess: (data) => {
            // Invalidate calls for specific confirmation (detail views)
            qc.invalidateQueries({
                queryKey: [
                    'calls',
                    { confirmationId: (data as any).callee_contact_id },
                ],
            })
            // Invalidate all calls lists (e.g., Telepastoring aggregates)
            qc.invalidateQueries({ queryKey: ['calls'] })
        },
    })
}
