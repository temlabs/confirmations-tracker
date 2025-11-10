import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { useFetchContacts } from '~/src/contact/useFetchContacts'
import { ContactListItem } from '~/src/contact/components/ContactListItem'
import { TelepastoringFilterModal } from '~/src/telepastoring/TelepastoringFilterModal'
import { useFetchCalls } from '~/src/call/useFetchCalls'
import { useFetchBacentas } from '~/src/bacenta/useFetchBacentas'

export const meta = () => [{ title: 'Telepastoring' }]

export default function Telepastoring() {
    const navigate = useNavigate()
    const location = useLocation()
    const { event, loaded } = useFetchCurrentEvent()

    const params = new URLSearchParams(location.search)
    const membersCsv = params.get('members') || ''
    const memberIds = membersCsv ? membersCsv.split(',').filter(Boolean) : []
    const fromDt = params.get('from_dt') || ''
    const toDt = params.get('to_dt') || ''
    const outcome = params.get('outcome') || '' // '' = all, 'none' = not called, otherwise outcome_id
    const showFilters = params.get('filters') === '1'

    const { data: members } = useFetchMembers()
    const { data: bacentas } = useFetchBacentas({
        orderBy: { column: 'name', ascending: true },
    })
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
    const bacentaIdToName = useMemo(() => {
        const map = new Map<string, string>()
        if (bacentas) {
            for (const b of bacentas) {
                map.set(b.id, b.name)
            }
        }
        return map
    }, [bacentas])

    // Contacts scoped to current event and optionally to selected callers
    const {
        data: contactsData,
        isLoading: contactsLoading,
        error: contactsError,
    } = useFetchContacts(
        event
            ? {
                  equals: {
                      event_id: event.id,
                  } as any,
                  in:
                      memberIds.length > 0
                          ? { contacted_by_member_id: memberIds as string[] }
                          : undefined,
                  orderBy: { column: 'created_at', ascending: false },
                  limit: 1000,
              }
            : undefined,
        { enabled: !!event }
    )

    // Build call filters
    const callFromIso = useMemo(() => {
        if (!fromDt) return undefined
        // datetime-local is local time without zone; convert to ISO
        try {
            const iso = new Date(fromDt).toISOString()
            return iso
        } catch {
            return undefined
        }
    }, [fromDt])
    const callToIso = useMemo(() => {
        if (!toDt) return undefined
        try {
            const iso = new Date(toDt).toISOString()
            return iso
        } catch {
            return undefined
        }
    }, [toDt])

    const {
        data: callsData,
        isLoading: callsLoading,
        error: callsError,
    } = useFetchCalls(
        {
            in:
                memberIds.length > 0
                    ? { caller_member_id: memberIds }
                    : undefined,
            equals:
                outcome && outcome !== 'none'
                    ? {
                          outcome_id: outcome,
                      }
                    : undefined,
            range:
                callFromIso || callToIso
                    ? {
                          call_timestamp: {
                              ...(callFromIso ? { gte: callFromIso } : {}),
                              ...(callToIso ? { lte: callToIso } : {}),
                          },
                      }
                    : undefined,
            orderBy: { column: 'call_timestamp', ascending: false },
            limit: 5000,
        },
        {
            // Enable once we have at least event and either members selected or a time filter
            enabled: !!event,
        }
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

    // Compute telepastoring results
    const results = useMemo(() => {
        if (!contactsData) return []
        if (!callsData) {
            // If outcome is 'none', we can still compute once calls load; until then show empty
            return outcome === 'none' ? [] : []
        }
        const contactById = new Map(contactsData.map((c) => [c.id, c]))

        if (outcome === 'none') {
            // Contacts assigned to selected callers that have NOT been called by the selected callers in the timeframe
            const calledIds = new Set<string>()
            for (const call of callsData) {
                if (call.callee_contact_id)
                    calledIds.add(call.callee_contact_id)
            }
            const pool =
                memberIds.length > 0
                    ? contactsData.filter((c) =>
                          memberIds.includes(c.contacted_by_member_id)
                      )
                    : contactsData
            return pool.filter((c) => !calledIds.has(c.id))
        }

        // Else: list unique contacts that have at least one call matching filters
        const matchedIds = new Set<string>()
        for (const call of callsData) {
            if (call.callee_contact_id) matchedIds.add(call.callee_contact_id)
        }
        const list: typeof contactsData = []
        for (const id of matchedIds) {
            const c = contactById.get(id)
            if (c) list.push(c)
        }
        return list
    }, [contactsData, callsData, outcome, memberIds])

    // Client-side search
    const [search, setSearch] = useState('')
    const filtered = useMemo(() => {
        if (!results) return []
        const q = search.trim().toLowerCase()
        if (!q) return results
        return results.filter((c) => {
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
    }, [results, search])

    const isLoading = contactsLoading || callsLoading
    const error = contactsError || callsError

    // Copy-to-clipboard
    const [copySuccess, setCopySuccess] = useState(false)
    function describeSelection(): string {
        if (!members || members.length === 0) return 'No selection'
        if (!memberIds.length) return 'All bacentas'
        const selected = new Set(memberIds)
        const membersByBacenta = new Map<string | null, string[]>()
        for (const m of members) {
            const key = (m.bacenta_id as string | null) ?? null
            const list = membersByBacenta.get(key) ?? []
            list.push(m.id)
            membersByBacenta.set(key, list)
        }
        const fullySelectedBacentas: string[] = []
        const individualNames: string[] = []
        const covered = new Set<string>()
        for (const [bid, mids] of membersByBacenta.entries()) {
            const allSelected = mids.every((id) => selected.has(id))
            if (allSelected) {
                if (bid && bacentaIdToName.get(bid)) {
                    fullySelectedBacentas.push(
                        bacentaIdToName.get(bid) as string
                    )
                } else {
                    fullySelectedBacentas.push('No bacenta')
                }
                mids.forEach((id) => covered.add(id))
            }
        }
        for (const id of selected) {
            if (!covered.has(id)) {
                individualNames.push(memberIdToName.get(id) ?? 'Unknown')
            }
        }
        // All fully selected
        const totalMembers = members.length
        if (memberIds.length === totalMembers) return 'All bacentas'
        const parts: string[] = []
        if (fullySelectedBacentas.length) parts.push(...fullySelectedBacentas)
        if (individualNames.length) parts.push(...individualNames)
        return parts.length ? parts.join(', ') : 'Custom selection'
    }

    function formatCallDataText(): string {
        if (!event || !members || !contactsData) return ''
        const now = new Date()
        const dateStr = now.toLocaleDateString('en-GB')
        const timeStr = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })

        const selectionDesc = describeSelection()

        const eventContactIds = new Set(contactsData.map((c) => c.id))
        const callsInScope = (callsData ?? []).filter(
            (call) =>
                call.callee_contact_id &&
                eventContactIds.has(call.callee_contact_id)
        )

        // Build members by bacenta for output ordering
        const membersByBacenta = new Map<string | null, typeof members>()
        for (const m of members) {
            // If selection is limited, include only those selected
            if (memberIds.length > 0 && !memberIds.includes(m.id)) continue
            const key = (m.bacenta_id as string | null) ?? null
            const list = membersByBacenta.get(key) ?? []
            list.push(m)
            membersByBacenta.set(key, list)
        }
        // If no selection filters, include all members (already included above)

        // Prepare lines
        let text = `*Telepastoring Calls*\n_As of ${dateStr} at ${timeStr}_\n\n`
        text += `Selection: ${selectionDesc}\n\n`

        // For deterministic output, sort bacenta names then members
        const entries = Array.from(membersByBacenta.entries()).sort((a, b) => {
            const an = a[0] ? (bacentaIdToName.get(a[0]) ?? '') : 'No bacenta'
            const bn = b[0] ? (bacentaIdToName.get(b[0]) ?? '') : 'No bacenta'
            return an.localeCompare(bn)
        })

        let overallMade = 0
        let overallDenom = 0
        for (const [bid, mems] of entries) {
            const bacentaName = bid
                ? (bacentaIdToName.get(bid) ?? 'Unknown Bacenta')
                : 'No bacenta'
            text += `*${bacentaName}*\n`
            const sorted = [...mems].sort((a, b) => {
                const an = a.full_name ?? `${a.first_name} ${a.last_name}`
                const bn = b.full_name ?? `${b.first_name} ${b.last_name}`
                return an.localeCompare(bn)
            })
            let bacentaMade = 0
            let bacentaDenom = 0
            sorted.forEach((m, idx) => {
                // Denominator: ALL contacts assigned to member (within current event)
                const pool = contactsData.filter(
                    (c) => c.contacted_by_member_id === m.id
                )
                const poolIds = new Set(pool.map((c) => c.id))
                // Calls numerator: calls in scope by member to contacts in the pool
                const made = callsInScope.filter(
                    (call) =>
                        call.caller_member_id === m.id &&
                        call.callee_contact_id &&
                        poolIds.has(call.callee_contact_id)
                ).length
                const memberName =
                    m.full_name ?? `${m.first_name} ${m.last_name}`
                text += `${idx + 1}. ${memberName} - ${made}/${pool.length}\n`
                bacentaMade += made
                bacentaDenom += pool.length
                overallMade += made
                overallDenom += pool.length
            })
            text += `Total - ${bacentaMade}/${bacentaDenom}\n\n`
        }
        text += `*Overall Total - ${overallMade}/${overallDenom}*`
        return text
    }

    async function handleCopyCallData() {
        const text = formatCallDataText()
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch {
            // no-op
        }
    }

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Telepastoring</h1>
                    <button
                        onClick={handleCopyCallData}
                        disabled={!event || !members || !contactsData}
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:bg-neutral-400 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#577F9F' }}
                    >
                        {copySuccess ? 'Copied!' : 'Copy call data'}
                    </button>
                </div>
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
                        <div className="ml-auto text-xs text-neutral-500">
                            {memberIds.length
                                ? `${memberIds.length} caller${memberIds.length !== 1 ? 's' : ''} selected`
                                : 'All callers'}
                        </div>
                    </div>
                    {/* Active filters */}
                    <div className="flex flex-wrap gap-2">
                        {fromDt ? (
                            <Chip
                                label={`From ${fromDt}`}
                                onClear={() => setParam('from_dt', null)}
                            />
                        ) : null}
                        {toDt ? (
                            <Chip
                                label={`To ${toDt}`}
                                onClear={() => setParam('to_dt', null)}
                            />
                        ) : null}
                        {outcome ? (
                            <Chip
                                label={
                                    outcome === 'none'
                                        ? 'Outcome: None / Not called'
                                        : `Outcome: ${outcome}`
                                }
                                onClear={() => setParam('outcome', null)}
                            />
                        ) : null}
                        {memberIds.map((id) => (
                            <Chip
                                key={id}
                                label={`Caller ${memberIdToName.get(id) ?? 'Unknown'}`}
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
                        {!fromDt && !toDt && !outcome && !memberIds.length ? (
                            <span className="text-xs text-neutral-500">
                                No filters applied
                            </span>
                        ) : null}
                    </div>
                </section>

                <section className="mt-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    {!event ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Select an event to view telepastoring.
                        </p>
                    ) : isLoading ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Loading…
                        </p>
                    ) : error ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Failed to load telepastoring data
                        </p>
                    ) : (filtered?.length ?? 0) === 0 ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            No results.
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
                    <TelepastoringFilterModal members={members} />
                )}
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
