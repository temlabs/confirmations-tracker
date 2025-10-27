import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesUpdate } from '~/types/database.types'

type Visit = Tables<'visits'>

export function useUpdateVisit() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string
            updates: TablesUpdate<'visits'>
        }) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('visits')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()
            if (error) throw error
            return data as Visit
        },
        // Intentionally omit onSuccess invalidation; caller will invalidate after related link updates
    })
}
