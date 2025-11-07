import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchContacts } from '~/src/contact/useFetchContacts'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'
import { ContactListItem } from '~/src/contact/components/ContactListItem'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { ContactsFilterModal } from '~/src/contact/components/ContactsFilterModal'
import { EditContactModal } from '~/src/contact/components/EditContactModal'

export const meta = () => [{ title: 'All Contacts' }]

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
    const attended = params.get('attended') || undefined
    const sort = params.get('sort') || 'time_desc'
    const status = params.get('status') || ''
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

    const baseFilters = event
        ? {
              equals: {
                  event_id: event.id,
                  ...(firstTimer !== undefined
                      ? { is_first_time: firstTimer === 'true' }
                      : {}),
                  ...(attended !== undefined
                      ? { attended: attended === 'true' }
                      : {}),
              } as any,
              in:
                  memberIds.length > 0
                      ? { contacted_by_member_id: memberIds as string[] }
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
              orderBy,
              limit: 200,
          }
        : undefined

    const {
        data: confirmedData,
        isLoading: confirmedLoading,
        error: confirmedError,
    } = useFetchConfirmations(baseFilters as any, {
        enabled: !!event && (status === 'confirmed' || status === 'advanced'),
        confirmationsWithTransportArrangedOnly: status === 'advanced',
    })

    const {
        data: contactsData,
        isLoading: contactsLoading,
        error: contactsError,
    } = useFetchContacts(
        status === 'unconfirmed' && baseFilters
            ? {
                  ...(baseFilters as any),
                  equals: {
                      ...(baseFilters as any).equals,
                      confirmed_at: null,
                  },
              }
            : baseFilters,
        {
            enabled: !!event && (status === '' || status === 'unconfirmed'),
        }
    )

    const data =
        status === 'confirmed' || status === 'advanced'
            ? confirmedData
            : contactsData
    const isLoading =
        status === 'confirmed' || status === 'advanced'
            ? confirmedLoading
            : contactsLoading
    const error =
        status === 'confirmed' || status === 'advanced'
            ? confirmedError
            : contactsError

    useEffect(() => {
        if (loaded && !event) navigate('/identity', { replace: true })
    }, [loaded, event, navigate])

    function setParam(key: string, value?: string | null) {
        const next = new URLSearchParams(location.search)
        if (!value) next.delete(key)
        else next.set(key, value)
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    // Client-side search of the currently presented list
    const [search, setSearch] = useState('')
    const filtered = useMemo(() => {
        if (!data) return []
        const q = search.trim().toLowerCase()
        if (!q) return data
        return data.filter((c) => {
            const first = c.first_name?.toLowerCase() ?? ''
            const last = (c.last_name ?? '').toLowerCase()
            const full = `${c.first_name} ${c.last_name ?? ''}`.toLowerCase()
            const contact = (c.contact_number ?? '').toLowerCase()
            return (
                first.includes(q) ||
                last.includes(q) ||
                full.includes(q) ||
                contact.includes(q)
            )
        })
    }, [data, search])

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">All Contacts</h1>
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
                        {attended === 'true' ? (
                            <Chip
                                label="Attended only"
                                onClear={() => setParam('attended', null)}
                            />
                        ) : attended === 'false' ? (
                            <Chip
                                label="Did not attend"
                                onClear={() => setParam('attended', null)}
                            />
                        ) : null}
                        {status ? (
                            <Chip
                                label={
                                    status === 'unconfirmed'
                                        ? 'Unconfirmed'
                                        : status === 'advanced'
                                          ? 'Confirmed + transport arranged'
                                          : 'Confirmed'
                                }
                                onClear={() => setParam('status', null)}
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
                        !attended &&
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
                            Select an event to view contacts.
                        </p>
                    ) : isLoading ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Loading…
                        </p>
                    ) : error ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Failed to load contacts
                        </p>
                    ) : (data?.length ?? 0) === 0 ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            No contacts yet.
                        </p>
                    ) : (
                        <div>
                            {/* Local search */}
                            <div className="mb-3">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search name or contact…"
                                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                />
                            </div>
                            <div className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                                {filtered.length} contact
                                {filtered.length !== 1 ? 's' : ''}
                            </div>
                            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filtered.map((c) => (
                                    <ContactListItem
                                        key={c.id}
                                        contact={c}
                                        byline={`Contacted by ${memberIdToName.get(c.contacted_by_member_id) ?? 'Unknown'}`}
                                        onPress={() =>
                                            navigate(`/contacts/${c.id}`)
                                        }
                                        onEdit={() => {
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
                    <ContactsFilterModal members={members} />
                )}

                {/* Edit modal */}
                {(() => {
                    const editId = new URLSearchParams(location.search).get(
                        'edit'
                    )
                    if (!editId) return null
                    const current = (data ?? []).find((x) => x.id === editId)
                    if (!current) return null
                    return <EditContactModal contact={current} />
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
