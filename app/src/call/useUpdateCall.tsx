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
            qc.invalidateQueries({
                queryKey: [
                    'calls',
                    { confirmationId: data.callee_confirmation_id },
                ],
            })
        },
    })
}
