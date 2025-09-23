import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesInsert } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

export function useCreateConfirmation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: TablesInsert<'confirmations'>) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('confirmations')
                .insert(input)
                .select('*')
                .single()
            if (error) throw error
            return data as Confirmation
        },
        onSuccess: (created) => {
            // Invalidate generic confirmations queries and event/member aggregates
            qc.invalidateQueries({ queryKey: ['confirmations'] })
            qc.invalidateQueries({ queryKey: ['event_member_targets'] })
            qc.invalidateQueries({ queryKey: ['events'] })
        },
    })
}
