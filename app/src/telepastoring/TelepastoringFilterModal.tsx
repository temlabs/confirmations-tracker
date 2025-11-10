import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Tables } from '~/types/database.types'
import { useFetchBacentas } from '~/src/bacenta/useFetchBacentas'
import { useFetchCallOutcomes } from '~/src/call/useFetchCallOutcomes'

type Member = Tables<'members'>

export type TelepastoringFilterModalProps = {
    members: Member[]
}

export function TelepastoringFilterModal({
    members,
}: TelepastoringFilterModalProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const { data: bacentas } = useFetchBacentas({
        orderBy: { column: 'name', ascending: true },
    })
    const { data: outcomes } = useFetchCallOutcomes()

    const params = new URLSearchParams(location.search)
    const initialFromDt = params.get('from_dt') ?? ''
    const initialToDt = params.get('to_dt') ?? ''
    const initialMembersCsv = params.get('members') ?? ''
    const initialOutcome = params.get('outcome') ?? ''

    const [fromDt, setFromDt] = useState(initialFromDt)
    const [toDt, setToDt] = useState(initialToDt)
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
        initialMembersCsv ? initialMembersCsv.split(',').filter(Boolean) : []
    )
    const [outcome, setOutcome] = useState(initialOutcome)

    useEffect(() => {
        setFromDt(initialFromDt)
        setToDt(initialToDt)
        setSelectedMemberIds(
            initialMembersCsv
                ? initialMembersCsv.split(',').filter(Boolean)
                : []
        )
        setOutcome(initialOutcome)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search])

    function toggleMember(id: string) {
        setSelectedMemberIds((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        )
    }

    const grouped = useMemo(() => {
        const map = new Map<string | null, Member[]>()
        for (const m of members) {
            const key = (m.bacenta_id as string | null) ?? null
            const list = map.get(key) ?? []
            list.push(m)
            map.set(key, list)
        }
        for (const [, arr] of map) {
            arr.sort((a, b) => {
                const an = a.full_name ?? `${a.first_name} ${a.last_name}`
                const bn = b.full_name ?? `${b.first_name} ${b.last_name}`
                return an.localeCompare(bn)
            })
        }
        return map
    }, [members])

    const bacentaName = (id: string | null) => {
        if (id === null) return 'No bacenta'
        const found = (bacentas ?? []).find((b) => b.id === id)
        return found?.name ?? 'Unknown'
    }

    function toggleBacenta(id: string | null) {
        const ids = (grouped.get(id) ?? []).map((m) => m.id)
        setSelectedMemberIds((prev) => {
            const set = new Set(prev)
            const allSelected = ids.every((x) => set.has(x))
            if (allSelected) {
                ids.forEach((x) => set.delete(x))
            } else {
                ids.forEach((x) => set.add(x))
            }
            return Array.from(set)
        })
    }

    function close() {
        const next = new URLSearchParams(location.search)
        next.delete('filters')
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    function apply() {
        const next = new URLSearchParams(location.search)
        if (fromDt) next.set('from_dt', fromDt)
        else next.delete('from_dt')
        if (toDt) next.set('to_dt', toDt)
        else next.delete('to_dt')
        if (selectedMemberIds.length > 0)
            next.set('members', selectedMemberIds.join(','))
        else next.delete('members')
        if (outcome) next.set('outcome', outcome)
        else next.delete('outcome')
        next.delete('filters')
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    function clearAll() {
        setFromDt('')
        setToDt('')
        setSelectedMemberIds([])
        setOutcome('')
    }

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

                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium">
                                From (call time)
                            </label>
                            <input
                                type="datetime-local"
                                value={fromDt}
                                onChange={(e) => setFromDt(e.target.value)}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium">
                                To (call time)
                            </label>
                            <input
                                type="datetime-local"
                                value={toDt}
                                onChange={(e) => setToDt(e.target.value)}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium">
                            Call outcome
                        </label>
                        <select
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        >
                            <option value="">All outcomes</option>
                            <option value="none">None / Not called</option>
                            {(outcomes ?? []).map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium">
                            Callers (grouped by bacenta)
                        </label>
                        <div className="mt-1 max-h-72 overflow-auto rounded-md border border-neutral-300 p-2 dark:border-neutral-700">
                            <div className="space-y-3">
                                {Array.from(grouped.entries())
                                    .sort((a, b) =>
                                        bacentaName(a[0]).localeCompare(
                                            bacentaName(b[0])
                                        )
                                    )
                                    .map(([bid, list]) => {
                                        const ids = list.map((m) => m.id)
                                        const allSelected = ids.every((x) =>
                                            selectedMemberIds.includes(x)
                                        )
                                        const someSelected =
                                            !allSelected &&
                                            ids.some((x) =>
                                                selectedMemberIds.includes(x)
                                            )
                                        return (
                                            <div key={bid ?? 'null'}>
                                                <div className="mb-1 flex items-center justify-between">
                                                    <div className="text-xs font-medium">
                                                        {bacentaName(bid)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleBacenta(bid)
                                                        }
                                                        className="rounded-md border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                                    >
                                                        {allSelected
                                                            ? 'Clear'
                                                            : someSelected
                                                              ? 'Select all'
                                                              : 'Select all'}
                                                    </button>
                                                </div>
                                                <ul className="space-y-1 pl-2">
                                                    {list.map((m) => {
                                                        const id = m.id
                                                        const name =
                                                            m.full_name ??
                                                            `${m.first_name} ${m.last_name}`
                                                        const checked =
                                                            selectedMemberIds.includes(
                                                                id
                                                            )
                                                        return (
                                                            <li
                                                                key={id}
                                                                className="flex items-center gap-2 text-sm"
                                                            >
                                                                <input
                                                                    id={`m-${id}`}
                                                                    type="checkbox"
                                                                    checked={
                                                                        checked
                                                                    }
                                                                    onChange={() =>
                                                                        toggleMember(
                                                                            id
                                                                        )
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={`m-${id}`}
                                                                >
                                                                    {name}
                                                                </label>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-between gap-2">
                    <button
                        type="button"
                        onClick={clearAll}
                        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
                    >
                        Clear all
                    </button>
                    <div className="flex gap-2">
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
        </div>
    )
}
