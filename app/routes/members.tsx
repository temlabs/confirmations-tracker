import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchEventMembers } from '~/src/event/useFetchEventMembers'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { MemberListItem } from '~/src/member/components/MemberListItem'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'
import { MembersFilterModal } from '~/src/member/components/MembersFilterModal'

export const meta = () => [{ title: 'Members' }]

export default function Members() {
    const navigate = useNavigate()
    const location = useLocation()
    const { event, loaded } = useFetchCurrentEvent()

    const { data: members } = useFetchMembers()
    const memberIdToInfo = useMemo(() => {
        const map = new Map<
            string,
            { name: string; bacentaId: string | null }
        >()
        if (members) {
            for (const m of members) {
                map.set(m.id, {
                    name: m.full_name ?? `${m.first_name} ${m.last_name}`,
                    bacentaId: (m.bacenta_id as string | null) ?? null,
                })
            }
        }
        return map
    }, [members])

    const params = new URLSearchParams(location.search)
    const membersCsv = params.get('members') || ''
    const memberIds = membersCsv ? membersCsv.split(',').filter(Boolean) : []
    const bacentasCsv = params.get('bacentas') || ''
    const bacentaIds = bacentasCsv ? bacentasCsv.split(',').filter(Boolean) : []
    const sort = params.get('sort') || 'pct_desc'
    const showFilters = params.get('filters') === '1'

    const { data: targets } = useFetchEventMembers(
        event
            ? {
                  equals: { event_id: event.id },
              }
            : undefined,
        {
            enabled: !!event,
            refetchOnWindowFocus: false,
            includeBacentaName: true,
        }
    )

    // Fetch last confirmation per member (optional, limited for perf)
    const { data: lastConfs } = useFetchConfirmations(
        event
            ? {
                  equals: { event_id: event.id },
                  orderBy: [
                      { column: 'confirmed_by_member_id', ascending: true },
                      { column: 'created_at', ascending: false },
                  ],
                  limit: 1000,
              }
            : undefined,
        { enabled: !!event, refetchOnWindowFocus: false }
    )

    useEffect(() => {
        if (loaded && !event) navigate('/identity', { replace: true })
    }, [loaded, event, navigate])

    const lastByMember = useMemo(() => {
        const map = new Map<string, string>()
        if (!lastConfs) return map
        for (const c of lastConfs) {
            const key = c.confirmed_by_member_id
            const existing = key ? map.get(key) : undefined
            if (
                key &&
                (!existing || new Date(c.created_at) > new Date(existing))
            ) {
                map.set(key, c.created_at)
            }
        }
        return map
    }, [lastConfs])

    const rows = useMemo(() => {
        const arr = (targets ?? []).map((t) => {
            const info = memberIdToInfo.get(t.member_id) ?? {
                name: 'Unknown',
                bacentaId: null,
            }
            const total = t.total_confirmations ?? 0
            const target = t.confirmations_target ?? 0
            const pct = target > 0 ? total / target : 0
            const last = lastByMember.get(t.member_id) ?? null
            return {
                id: t.member_id,
                name: (t as any).member_full_name ?? info.name,
                bacentaId: info.bacentaId,
                bacentaName: (t as any).bacenta_name ?? null,
                total,
                target,
                pct,
                last,
            }
        })
        const byMembers =
            memberIds.length > 0
                ? arr.filter((r) => memberIds.includes(r.id))
                : arr
        const byBacenta =
            bacentaIds.length > 0
                ? byMembers.filter(
                      (r) => r.bacentaId && bacentaIds.includes(r.bacentaId)
                  )
                : byMembers
        // Sort
        const sorted = byBacenta.sort((a, b) => {
            switch (sort) {
                case 'pct_asc':
                    return a.pct - b.pct
                case 'pct_desc':
                    return b.pct - a.pct
                case 'name_asc':
                    return a.name.localeCompare(b.name)
                case 'name_desc':
                    return b.name.localeCompare(a.name)
                case 'conf_asc':
                    return a.total - b.total
                case 'conf_desc':
                    return b.total - a.total
                default:
                    return b.pct - a.pct
            }
        })
        return sorted
    }, [targets, memberIdToInfo, lastByMember, memberIds, bacentaIds, sort])

    function setParam(key: string, value?: string | null) {
        const next = new URLSearchParams(location.search)
        if (!value) next.delete(key)
        else next.set(key, value)
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">Members</h1>

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
                                <option value="pct_desc">
                                    % of target (high)
                                </option>
                                <option value="pct_asc">
                                    % of target (low)
                                </option>
                                <option value="conf_desc">
                                    Confirmations (high)
                                </option>
                                <option value="conf_asc">
                                    Confirmations (low)
                                </option>
                                <option value="name_asc">Name (A–Z)</option>
                                <option value="name_desc">Name (Z–A)</option>
                            </select>
                        </div>
                    </div>
                    {/* Active filters */}
                    <div className="flex flex-wrap gap-2">
                        {memberIds.map((id) => (
                            <Chip
                                key={id}
                                label={
                                    memberIdToInfo.get(id)?.name ?? 'Unknown'
                                }
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
                        {bacentaIds.map((id) => (
                            <Chip
                                key={id}
                                label={`Bacenta ${id}`}
                                onClear={() => {
                                    const remaining = bacentaIds.filter(
                                        (x) => x !== id
                                    )
                                    setParam(
                                        'bacentas',
                                        remaining.length
                                            ? remaining.join(',')
                                            : null
                                    )
                                }}
                            />
                        ))}
                        {!memberIds.length && (
                            <span className="text-xs text-neutral-500">
                                No filters applied
                            </span>
                        )}
                    </div>
                </section>

                <section className="mt-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    {!event ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Select an event first.
                        </p>
                    ) : rows.length === 0 ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            No members found.
                        </p>
                    ) : (
                        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {rows.map((r) => (
                                <MemberListItem
                                    key={r.id}
                                    member={
                                        {
                                            id: r.id,
                                            first_name: '',
                                            last_name: '',
                                            full_name: r.name,
                                            bacenta_id: r.bacentaId,
                                            created_at: '',
                                            updated_at: '',
                                        } as unknown as Tables<'members'>
                                    }
                                    bacentaName={r.bacentaName ?? '—'}
                                    totalConfirmations={r.total}
                                    confirmationsTarget={r.target}
                                    lastConfirmationAt={r.last}
                                />
                            ))}
                        </ul>
                    )}
                </section>
                {showFilters && members && (
                    <MembersFilterModal members={members} />
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
