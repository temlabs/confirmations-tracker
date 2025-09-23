import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables, TablesInsert } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

type EventMemberTarget = Tables<'event_member_targets'>

type Event = Tables<'events'>

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
        onMutate: async (input) => {
            const eventId = input.event_id
            const memberId = input.confirmed_by_member_id

            await Promise.all([
                qc.cancelQueries({ queryKey: ['event_member_targets'] }),
                qc.cancelQueries({ queryKey: ['events'] }),
                qc.cancelQueries({ queryKey: ['confirmations'] }),
            ])

            const previousTargets = qc.getQueriesData<EventMemberTarget[]>({
                queryKey: ['event_member_targets'],
            })
            const previousEvents = qc.getQueriesData<Event[]>({
                queryKey: ['events'],
            })

            qc.setQueriesData<EventMemberTarget[]>(
                { queryKey: ['event_member_targets'] },
                (old) => {
                    if (!old) return old
                    let updated = false
                    const next = old.map((row) => {
                        if (
                            row.event_id === eventId &&
                            row.member_id === memberId
                        ) {
                            updated = true
                            return {
                                ...row,
                                total_confirmations:
                                    (row.total_confirmations ?? 0) + 1,
                            }
                        }
                        return row
                    })
                    return updated ? next : old
                }
            )

            qc.setQueriesData<Event[]>({ queryKey: ['events'] }, (old) => {
                if (!old) return old
                let updated = false
                const next = old.map((row) => {
                    if (row.id === eventId) {
                        updated = true
                        return {
                            ...row,
                            total_confirmations:
                                (row.total_confirmations ?? 0) + 1,
                        }
                    }
                    return row
                })
                return updated ? next : old
            })

            return { previousTargets, previousEvents }
        },
        onError: (_err, _input, ctx) => {
            if (!ctx) return
            for (const [key, data] of ctx.previousTargets) {
                qc.setQueryData(key, data)
            }
            for (const [key, data] of ctx.previousEvents) {
                qc.setQueryData(key, data)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['confirmations'] })
            qc.invalidateQueries({ queryKey: ['event_member_targets'] })
            qc.invalidateQueries({ queryKey: ['events'] })
        },
    })
}
