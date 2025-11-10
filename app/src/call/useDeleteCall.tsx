import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'

export function useDeleteCall() {
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
            const { error } = await supabase.from('calls').delete().eq('id', id)
            if (error) throw error
            return { id, confirmationId }
        },
        onSuccess: ({ confirmationId }) => {
            // Invalidate calls for specific confirmation (detail views)
            qc.invalidateQueries({ queryKey: ['calls', { confirmationId }] })
            // Invalidate all calls lists (e.g., Telepastoring aggregates)
            qc.invalidateQueries({ queryKey: ['calls'] })
        },
    })
}
