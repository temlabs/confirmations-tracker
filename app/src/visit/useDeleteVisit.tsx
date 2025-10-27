import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'

export function useDeleteVisit() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            confirmationId,
        }: {
            id: string
            confirmationId: string
        }) => {
            const supabase = getSupabaseBrowserClient()
            // delete linking rows first due to FK
            await supabase.from('visit_visitors').delete().eq('visit_id', id)
            await supabase.from('visit_visitees').delete().eq('visit_id', id)
            const { error } = await supabase
                .from('visits')
                .delete()
                .eq('id', id)
            if (error) throw error
            return { id, confirmationId }
        },
        onSuccess: ({ confirmationId }) => {
            qc.invalidateQueries({ queryKey: ['visits', { confirmationId }] })
        },
    })
}
