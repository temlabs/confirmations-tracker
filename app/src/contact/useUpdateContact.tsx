import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesUpdate } from '~/types/database.types'

type Contact = Tables<'contacts'>

export function useUpdateContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string
            updates: TablesUpdate<'contacts'>
        }) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('contacts')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()
            if (error) throw error
            return data as Contact
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['contacts'] })
            // ensure contact detail views refresh immediately
            if (data?.id) {
                qc.invalidateQueries({ queryKey: ['contact', data.id] })
            } else {
                qc.invalidateQueries({ queryKey: ['contact'] })
            }
            qc.invalidateQueries({ queryKey: ['event_member_targets'] })
            qc.invalidateQueries({ queryKey: ['events'] })
        },
    })
}
