import { useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'
import { ConfirmationListItem } from '~/src/confirmation/components/ConfirmationListItem'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { ConfirmationsFilterModal } from '~/src/confirmation/components/ConfirmationsFilterModal'
import { EditConfirmationModal } from '~/src/confirmation/components/EditConfirmationModal'

export const meta = () => [{ title: 'All Confirmations' }]

export default function Confirmations() {
    const navigate = useNavigate()
    const location = useLocation()
    const { event, loaded } = useFetchCurrentEvent()

    const { data: members } = useFetchMembers()
    const memberIdToName = useMemo(() => {
        const map = new Map<string, string>()
        if (members) {
            for (const m of members) {
                const name = m.full_name ?? `${m.first_name} ${m.last_name}`
                map.set(m.id, name)
            }
        }
        return map
    }, [members])

    const params = new URLSearchParams(location.search)
    const membersCsv = params.get('members') || ''
    const memberIds = membersCsv ? membersCsv.split(',').filter(Boolean) : []
    const from = params.get('from') || undefined
    const to = params.get('to') || undefined
    const firstTimer = params.get('first_timer') || undefined
    const sort = params.get('sort') || 'time_desc'
    const showFilters = params.get('filters') === '1'

    const orderBy = useMemo(() => {
        switch (sort) {
            case 'name_asc':
                return [
                    { column: 'first_name' as const, ascending: true },
                    { column: 'last_name' as const, ascending: true },
                    { column: 'created_at' as const, ascending: false },
                ]
            case 'name_desc':
                return [
                    { column: 'first_name' as const, ascending: false },
                    { column: 'last_name' as const, ascending: false },
                    { column: 'created_at' as const, ascending: false },
                ]
            case 'time_asc':
                return [{ column: 'created_at' as const, ascending: true }]
            case 'time_desc':
            default:
                return [{ column: 'created_at' as const, ascending: false }]
        }
    }, [sort])

    const { data, isLoading, error } = useFetchConfirmations(
        event
            ? {
                  equals: {
                      event_id: event.id,
                  },
                  in:
                      memberIds.length > 0
                          ? { confirmed_by_member_id: memberIds as string[] }
                          : undefined,
                  range:
                      from || to
                          ? {
                                created_at: {
                                    ...(from ? { gte: from } : {}),
                                    ...(to ? { lte: to } : {}),
                                },
                            }
                          : undefined,
                  equals:
                      firstTimer !== undefined
                          ? { is_first_time: firstTimer === 'true' }
                          : undefined,
                  orderBy,
                  limit: 200,
              }
            : undefined,
        { enabled: !!event }
    )

    useEffect(() => {
        if (loaded && !event) navigate('/identity', { replace: true })
    }, [loaded, event, navigate])

    function setParam(key: string, value?: string | null) {
        const next = new URLSearchParams(location.search)
        if (!value) next.delete(key)
        else next.set(key, value)
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">All Confirmations</h1>
                {/* Controls */}
                <section className="mt-3 flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setParam('filters', '1')}
                            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                            Filters
                        </button>
                        <div className="ml-auto">
                            <label className="mr-2 text-xs font-medium">
                                Sort
                            </label>
                            <select
                                value={sort}
                                onChange={(e) =>
                                    setParam('sort', e.target.value)
                                }
                                className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="time_desc">Time (newest)</option>
                                <option value="time_asc">Time (oldest)</option>
                                <option value="name_asc">Name (A–Z)</option>
                                <option value="name_desc">Name (Z–A)</option>
                            </select>
                        </div>
                    </div>
                    {/* Active filters */}
                    <div className="flex flex-wrap gap-2">
                        {from ? (
                            <Chip
                                label={`From ${from}`}
                                onClear={() => setParam('from', null)}
                            />
                        ) : null}
                        {to ? (
                            <Chip
                                label={`To ${to}`}
                                onClear={() => setParam('to', null)}
                            />
                        ) : null}
                        {firstTimer === 'true' ? (
                            <Chip
                                label="First timers only"
                                onClear={() => setParam('first_timer', null)}
                            />
                        ) : firstTimer === 'false' ? (
                            <Chip
                                label="Returning only"
                                onClear={() => setParam('first_timer', null)}
                            />
                        ) : null}
                        {memberIds.map((id) => (
                            <Chip
                                key={id}
                                label={`By ${memberIdToName.get(id) ?? 'Unknown'}`}
                                onClear={() => {
                                    const remaining = memberIds.filter(
                                        (x) => x !== id
                                    )
                                    setParam(
                                        'members',
                                        remaining.length
                                            ? remaining.join(',')
                                            : null
                                    )
                                }}
                            />
                        ))}
                        {sort !== 'time_desc' ? (
                            <Chip
                                label={`Sort: ${sort.replace('_', ' ')}`}
                                onClear={() => setParam('sort', 'time_desc')}
                            />
                        ) : null}
                        {!from &&
                        !to &&
                        !firstTimer &&
                        !memberIds.length &&
                        sort === 'time_desc' ? (
                            <span className="text-xs text-neutral-500">
                                No filters applied
                            </span>
                        ) : null}
                    </div>
                </section>

                <section className="mt-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    {!event ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Select an event to view confirmations.
                        </p>
                    ) : isLoading ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Loading…
                        </p>
                    ) : error ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Failed to load confirmations
                        </p>
                    ) : (data?.length ?? 0) === 0 ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            No confirmations yet.
                        </p>
                    ) : (
                        <div>
                            <div className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                                {data!.length} confirmation
                                {data!.length !== 1 ? 's' : ''}
                            </div>
                            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {data!.map((c) => (
                                    <ConfirmationListItem
                                        key={c.id}
                                        confirmation={c}
                                        byline={`Confirmed by ${memberIdToName.get(c.confirmed_by_member_id) ?? 'Unknown'}`}
                                        onPress={() => {
                                            const next = new URLSearchParams(
                                                location.search
                                            )
                                            next.set('edit', c.id)
                                            navigate({
                                                search: `?${next.toString()}`,
                                            })
                                        }}
                                    />
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {showFilters && members && (
                    <ConfirmationsFilterModal members={members} />
                )}

                {/* Edit modal */}
                {(() => {
                    const editId = new URLSearchParams(location.search).get(
                        'edit'
                    )
                    if (!editId) return null
                    const current = (data ?? []).find((x) => x.id === editId)
                    if (!current) return null
                    return <EditConfirmationModal confirmation={current} />
                })()}
            </div>
        </main>
    )
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700">
            {label}
            <button
                type="button"
                onClick={onClear}
                className="rounded-full px-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Clear filter"
                title="Clear"
            >
                ×
            </button>
        </span>
    )
}
