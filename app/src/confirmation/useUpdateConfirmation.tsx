import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesUpdate } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

export function useUpdateConfirmation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string
            updates: TablesUpdate<'confirmations'>
        }) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('confirmations')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()
            if (error) throw error
            return data as Confirmation
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['confirmations'] })
            qc.invalidateQueries({ queryKey: ['event_member_targets'] })
            qc.invalidateQueries({ queryKey: ['events'] })
        },
    })
}
