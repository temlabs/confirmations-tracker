import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Tables } from '~/types/database.types'
import { useFetchBacentas } from '~/src/bacenta/useFetchBacentas'

type Member = Tables<'members'>

export function MembersFilterModal({ members }: { members: Member[] }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { data: bacentas } = useFetchBacentas({
        orderBy: { column: 'name', ascending: true },
    })

    const params = new URLSearchParams(location.search)
    const initialMembersCsv = params.get('members') ?? ''
    const initialBacentaCsv = params.get('bacentas') ?? ''

    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
        initialMembersCsv ? initialMembersCsv.split(',').filter(Boolean) : []
    )
    const [selectedBacentaIds, setSelectedBacentaIds] = useState<string[]>(
        initialBacentaCsv ? initialBacentaCsv.split(',').filter(Boolean) : []
    )

    useEffect(() => {
        setSelectedMemberIds(
            initialMembersCsv
                ? initialMembersCsv.split(',').filter(Boolean)
                : []
        )
        setSelectedBacentaIds(
            initialBacentaCsv
                ? initialBacentaCsv.split(',').filter(Boolean)
                : []
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search])

    function close() {
        const next = new URLSearchParams(location.search)
        next.delete('filters')
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    function apply() {
        const next = new URLSearchParams(location.search)
        if (selectedMemberIds.length)
            next.set('members', selectedMemberIds.join(','))
        else next.delete('members')
        if (selectedBacentaIds.length)
            next.set('bacentas', selectedBacentaIds.join(','))
        else next.delete('bacentas')
        next.delete('filters')
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    function toggle(
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        id: string
    ) {
        setter((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const bacentaOptions = useMemo(() => {
        const used = new Set<string>()
        for (const m of members) {
            const bid = (m.bacenta_id as string | null) ?? null
            if (bid) used.add(bid)
        }
        const options = (bacentas ?? [])
            .filter((b) => used.has(b.id))
            .map((b) => ({ id: b.id, name: b.name }))
        return options
    }, [members, bacentas])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={close}
                aria-hidden
            />
            <div className="relative w-full max-w-lg rounded-md border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs font-medium">Members</div>
                        <div className="mt-1 max-h-64 overflow-auto rounded-md border border-neutral-300 p-2 dark:border-neutral-700">
                            <ul className="space-y-1">
                                {members.map((m) => (
                                    <li
                                        key={m.id}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedMemberIds.includes(
                                                m.id
                                            )}
                                            onChange={() =>
                                                toggle(
                                                    setSelectedMemberIds,
                                                    m.id
                                                )
                                            }
                                        />
                                        <span>
                                            {m.full_name ??
                                                `${m.first_name} ${m.last_name}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-medium">Bacenta</div>
                        <div className="mt-1 max-h-64 overflow-auto rounded-md border border-neutral-300 p-2 dark:border-neutral-700">
                            <ul className="space-y-1">
                                {bacentaOptions.map((b) => (
                                    <li
                                        key={b.id}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedBacentaIds.includes(
                                                b.id
                                            )}
                                            onChange={() =>
                                                toggle(
                                                    setSelectedBacentaIds,
                                                    b.id
                                                )
                                            }
                                        />
                                        <span>{b.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={apply}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    )
}
