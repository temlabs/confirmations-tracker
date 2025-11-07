import {
    useQuery,
    type UseQueryOptions,
    type UseQueryResult,
    type QueryKey,
} from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '~/lib/supabase.client'
import type { Tables } from '~/types/database.types'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'

type EventMemberTarget = Tables<'event_member_targets'>

export type EventMemberTargetsFilter = {
    equals?: Partial<
        Pick<
            EventMemberTarget,
            | 'event_id'
            | 'member_id'
            | 'attendance_target'
            | 'confirmations_target'
            | 'total_attendees'
            | 'total_confirmations'
        >
    >
    in?: Partial<{
        [K in keyof EventMemberTarget]: NonNullable<EventMemberTarget[K]>[]
    }>
    ilike?: Partial<Pick<EventMemberTarget, 'event_id' | 'member_id'>>
    orderBy?: { column: keyof EventMemberTarget; ascending?: boolean }
    limit?: number
}

type FetchEventMemberTargetsOptions = Omit<
    UseQueryOptions<
        (EventMemberTarget & {
            bacenta_name?: string | null
            member_full_name?: string | null
        })[],
        Error,
        (EventMemberTarget & {
            bacenta_name?: string | null
            member_full_name?: string | null
        })[],
        QueryKey
    >,
    'queryKey' | 'queryFn'
> & {
    includeBacentaName?: boolean
    /** When true (default), scope to current event unless filters already specify event_id */
    scopeToCurrentEvent?: boolean
}

export function useFetchEventMembers(
    filters?: EventMemberTargetsFilter,
    config?: FetchEventMemberTargetsOptions
): UseQueryResult<
    (EventMemberTarget & {
        bacenta_name?: string | null
        member_full_name?: string | null
    })[],
    Error
> {
    const { event } = useFetchCurrentEvent()
    const shouldScope =
        (config?.scopeToCurrentEvent ?? true) &&
        !(filters && filters.equals && 'event_id' in filters.equals)

    const finalFilters: EventMemberTargetsFilter | undefined =
        shouldScope && event
            ? {
                  ...filters,
                  equals: { ...(filters?.equals ?? {}), event_id: event.id },
              }
            : filters

    const effectiveEnabled =
        (config?.enabled ?? true) && (!shouldScope || !!event)

    return useQuery<
        (EventMemberTarget & {
            bacenta_name?: string | null
            member_full_name?: string | null
        })[],
        Error,
        (EventMemberTarget & {
            bacenta_name?: string | null
            member_full_name?: string | null
        })[],
        QueryKey
    >({
        queryKey: ['event_member_targets', finalFilters ?? null],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient()
            const select = config?.includeBacentaName
                ? '*, members(id, full_name, first_name, last_name, bacenta_id, bacentas(id, name))'
                : '*'
            let query = supabase.from('event_member_targets').select(select)

            if (finalFilters?.equals) {
                for (const [key, value] of Object.entries(
                    finalFilters.equals
                )) {
                    if (value === undefined) continue
                    const column = key as keyof EventMemberTarget as string
                    if (value === null) {
                        query = query.is(column, null)
                    } else {
                        query = query.eq(column, value as never)
                    }
                }
            }

            if (finalFilters?.in) {
                for (const [key, arr] of Object.entries(finalFilters.in)) {
                    if (!arr || arr.length === 0) continue
                    const column = key as keyof EventMemberTarget as string
                    query = query.in(column, arr as never[])
                }
            }

            if (finalFilters?.ilike) {
                for (const [key, pattern] of Object.entries(
                    finalFilters.ilike
                )) {
                    if (!pattern) continue
                    const column = key as keyof EventMemberTarget as string
                    query = query.ilike(column, pattern as string)
                }
            }

            if (finalFilters?.orderBy) {
                const { column, ascending = true } = finalFilters.orderBy
                query = query.order(column as string, { ascending })
            }

            if (typeof finalFilters?.limit === 'number') {
                query = query.limit(finalFilters.limit)
            }

            const { data, error } = await query
            if (error) throw error
            if (!data) return []
            if (!config?.includeBacentaName)
                return data as unknown as (EventMemberTarget & {
                    bacenta_name?: string | null
                    member_full_name?: string | null
                })[]
            const mapped = (data as unknown as Array<any>).map((row) => ({
                ...(row as EventMemberTarget),
                member_full_name:
                    row?.members?.full_name ??
                    `${row?.members?.first_name ?? ''} ${row?.members?.last_name ?? ''}`.trim(),
                bacenta_name: row?.members?.bacentas?.name ?? null,
            }))
            return mapped
        },
        ...(config ?? {}),
        enabled: effectiveEnabled,
    })
}
