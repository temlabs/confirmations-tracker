import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'

export function useDeleteContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', id)
            if (error) throw error
            return id
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['contacts'] })
            qc.invalidateQueries({ queryKey: ['event_member_targets'] })
            qc.invalidateQueries({ queryKey: ['events'] })
        },
    })
}
