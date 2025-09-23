import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Tables } from '~/types/database.types'

type Member = Tables<'members'>

export type ConfirmationsFilterModalProps = {
    members: Member[]
}

export function ConfirmationsFilterModal({
    members,
}: ConfirmationsFilterModalProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const params = new URLSearchParams(location.search)
    const initialFrom = params.get('from') ?? ''
    const initialTo = params.get('to') ?? ''
    const initialMembersCsv = params.get('members') ?? ''
    const initialSelected = useMemo(
        () =>
            initialMembersCsv
                ? initialMembersCsv.split(',').filter(Boolean)
                : [],
        [initialMembersCsv]
    )

    const [from, setFrom] = useState(initialFrom)
    const [to, setTo] = useState(initialTo)
    const [selectedMemberIds, setSelectedMemberIds] =
        useState<string[]>(initialSelected)

    useEffect(() => {
        setFrom(initialFrom)
        setTo(initialTo)
        setSelectedMemberIds(initialSelected)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search])

    function toggleMember(id: string) {
        setSelectedMemberIds((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        )
    }

    function close() {
        const next = new URLSearchParams(location.search)
        next.delete('filters')
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    function apply() {
        const next = new URLSearchParams(location.search)
        if (from) next.set('from', from)
        else next.delete('from')
        if (to) next.set('to', to)
        else next.delete('to')
        if (selectedMemberIds.length > 0)
            next.set('members', selectedMemberIds.join(','))
        else next.delete('members')
        next.delete('filters')
        navigate({ search: next.toString() ? `?${next.toString()}` : '' })
    }

    function clearAll() {
        setFrom('')
        setTo('')
        setSelectedMemberIds([])
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
                                From
                            </label>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium">
                                To
                            </label>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium">
                            By members
                        </label>
                        <div className="mt-1 max-h-56 overflow-auto rounded-md border border-neutral-300 p-2 dark:border-neutral-700">
                            <ul className="space-y-1">
                                {members.map((m) => {
                                    const id = m.id
                                    const name =
                                        m.full_name ??
                                        `${m.first_name} ${m.last_name}`
                                    const checked =
                                        selectedMemberIds.includes(id)
                                    return (
                                        <li
                                            key={id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                id={`m-${id}`}
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    toggleMember(id)
                                                }
                                            />
                                            <label htmlFor={`m-${id}`}>
                                                {name}
                                            </label>
                                        </li>
                                    )
                                })}
                            </ul>
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
