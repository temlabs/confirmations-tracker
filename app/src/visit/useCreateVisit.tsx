import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesInsert } from '~/types/database.types'

type Visit = Tables<'visits'>

export function useCreateVisit() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            visit,
            visitorMemberIds,
            visiteeConfirmationId,
            extraVisiteeIds = [],
        }: {
            visit: TablesInsert<'visits'>
            visitorMemberIds: string[]
            visiteeConfirmationId: string
            extraVisiteeIds?: string[]
        }) => {
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('visits')
                .insert(visit)
                .select('*')
                .single()
            if (error) throw error
            const created = data as Visit

            if (visitorMemberIds.length > 0) {
                const { error: vvErr } = await supabase
                    .from('visit_visitors')
                    .insert(
                        visitorMemberIds.map((member_id) => ({
                            visit_id: created.id,
                            member_id,
                        }))
                    )
                if (vvErr) throw vvErr
            }

            {
                const { error: veErr } = await supabase
                    .from('visit_visitees')
                    .insert([
                        {
                            visit_id: created.id,
                            confirmation_id: visiteeConfirmationId,
                        },
                        ...extraVisiteeIds
                            .filter((x) => x && x !== visiteeConfirmationId)
                            .map((confirmation_id) => ({
                                visit_id: created.id,
                                confirmation_id,
                            })),
                    ])
                if (veErr) throw veErr
            }

            return created
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({
                queryKey: [
                    'visits',
                    { confirmationId: variables.visiteeConfirmationId },
                ],
            })
        },
    })
}
