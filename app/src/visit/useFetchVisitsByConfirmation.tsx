import {
    useQuery,
    type QueryKey,
    type UseQueryResult,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'

type Visit = Tables<'visits'>
type VisitVisitors = Tables<'visit_visitors'>
type VisitVisitees = Tables<'visit_visitees'>
type Member = Tables<'members'>
type Confirmation = Tables<'contacts'>

export type VisitWithJoins = Visit & {
    visitors: Array<
        Pick<Member, 'id' | 'first_name' | 'last_name' | 'full_name'>
    >
    visitees: Array<Pick<Confirmation, 'id' | 'first_name' | 'last_name'>>
}

export function useFetchVisitsByConfirmation(
    confirmationId: string | null | undefined
): UseQueryResult<VisitWithJoins[], Error> {
    return useQuery<VisitWithJoins[], Error, VisitWithJoins[], QueryKey>({
        queryKey: ['visits', { confirmationId: confirmationId ?? null }],
        enabled: !!confirmationId,
        queryFn: async () => {
            if (!confirmationId) return []
            const supabase = getSupabaseBrowserClient()
            const { data, error } = await supabase
                .from('visits')
                .select(
                    `
                    *,
                    visit_visitors!visit_visitors_visit_id_fkey(
                        members(id, first_name, last_name, full_name)
                    ),
                    visit_visitees!visit_visitees_visit_id_fkey(
                        contacts(id, first_name, last_name)
                    )
                `
                )
                .in(
                    'id',
                    (
                        await supabase
                            .from('visit_visitees')
                            .select('visit_id')
                            .eq('contact_id', confirmationId)
                    ).data?.map((r) => r.visit_id) ?? []
                )
                .order('updated_at', { ascending: false })

            if (error) throw error
            const rows = (data ?? []) as any[]
            return rows.map((r) => ({
                ...(r as Visit),
                visitors: (r.visit_visitors ?? [])
                    .map((vv: any) => vv.members)
                    .filter(Boolean),
                visitees: (r.visit_visitees ?? [])
                    .map((ve: any) => ve.contacts)
                    .filter(Boolean),
            })) as VisitWithJoins[]
        },
    })
}
