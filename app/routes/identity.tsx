import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { useFetchEvents } from '~/src/event/useFetchEvents'
import { useFetchEventMembers } from '~/src/event/useFetchEventMembers'
import type { Tables } from '~/types/database.types'

type Member = Tables<'members'>
type Event = Tables<'events'>

export const meta = () => [{ title: 'Identify Yourself' }]

export default function Identity() {
    const navigate = useNavigate()
    const [selectedEventId, setSelectedEventId] = useState('')
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<Member | null>(null)
    const listRef = useRef<HTMLUListElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const {
        data: events,
        isLoading: eventsLoading,
        error: eventsError,
    } = useFetchEvents({
        orderBy: { column: 'event_timestamp', ascending: false },
    })

    const selectedEvent: Event | null = useMemo(() => {
        if (!events) return null
        return events.find((e) => e.id === selectedEventId) ?? null
    }, [events, selectedEventId])

    const {
        data: eventTargets,
        isLoading: targetsLoading,
        error: targetsError,
    } = useFetchEventMembers(
        selectedEventId ? { equals: { event_id: selectedEventId } } : undefined,
        { enabled: !!selectedEventId }
    )

    const memberIdsForEvent = useMemo(() => {
        return (eventTargets ?? []).map((t) => t.member_id).filter(Boolean)
    }, [eventTargets])

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query), 200)
        return () => clearTimeout(id)
    }, [query])

    const {
        data: members,
        isLoading,
        error,
    } = useFetchMembers(
        selectedEventId
            ? {
                  in: { id: memberIdsForEvent as string[] },
                  orderBy: { column: 'full_name', ascending: true },
              }
            : undefined,
        { enabled: !!selectedEventId && memberIdsForEvent.length > 0 }
    )

    const filtered = useMemo(() => {
        if (!members) return []
        if (!debouncedQuery.trim()) return members
        const q = debouncedQuery.toLowerCase()
        return members.filter((m) =>
            (m.full_name ?? `${m.first_name} ${m.last_name}`)
                .toLowerCase()
                .includes(q)
        )
    }, [members, debouncedQuery])

    function handleSelect(member: Member) {
        setSelected(member)
        setQuery(member.full_name ?? `${member.first_name} ${member.last_name}`)
        setIsOpen(false)
    }

    function handleBegin() {
        if (!selectedEventId || !selected) return
        try {
            localStorage.setItem('ct.user', JSON.stringify(selected))
            if (selectedEvent) {
                localStorage.setItem('ct.event', JSON.stringify(selectedEvent))
            }
        } catch {}
        navigate('/')
    }

    useEffect(() => {
        // Clear member selection when event changes
        setSelected(null)
        setQuery('')
        setIsOpen(false)
    }, [selectedEventId])

    useEffect(() => {
        function onOutsidePointerDown(e: PointerEvent) {
            if (!containerRef.current) return
            if (!containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                inputRef.current?.blur()
            }
        }
        document.addEventListener('pointerdown', onOutsidePointerDown)
        return () =>
            document.removeEventListener('pointerdown', onOutsidePointerDown)
    }, [])

    return (
        <main className="min-h-[100svh] flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <h1 className="text-center text-2xl font-semibold leading-snug">
                    A certain man made a great supper, and bade many
                    <span className="block text-base text-neutral-500">
                        (Luke 14:16)
                    </span>
                </h1>

                <p className="text-center text-lg">
                    Select your event, then search and select your name.
                    <span className="block text-xs text-neutral-500">
                        You can change this later.
                    </span>
                </p>

                <div>
                    <label
                        htmlFor="event-select"
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
                    >
                        Event
                    </label>
                    <select
                        id="event-select"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                        <option value="" disabled>
                            {eventsLoading
                                ? 'Loading events…'
                                : 'Select an event'}
                        </option>
                        {eventsError && (
                            <option value="" disabled>
                                Failed to load events
                            </option>
                        )}
                        {(events ?? []).map((ev) => (
                            <option key={ev.id} value={ev.id}>
                                {ev.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="relative" ref={containerRef}>
                    <label htmlFor="member-search" className="sr-only">
                        Search for your name
                    </label>
                    <input
                        id="member-search"
                        ref={inputRef}
                        type="search"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        placeholder="Type your name…"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                            setSelected(null)
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setIsOpen(false)
                                inputRef.current?.blur()
                            }
                        }}
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                        aria-autocomplete="list"
                        aria-expanded={isOpen}
                        aria-controls="member-options"
                        role="combobox"
                        disabled={!selectedEventId || targetsLoading}
                    />
                    {isOpen && (
                        <ul
                            id="member-options"
                            ref={listRef}
                            role="listbox"
                            className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            {(!selectedEventId || targetsLoading) && (
                                <li className="px-3 py-2 text-sm text-neutral-500">
                                    {targetsLoading
                                        ? 'Loading event members…'
                                        : 'Select an event first'}
                                </li>
                            )}
                            {selectedEventId &&
                                !targetsLoading &&
                                isLoading && (
                                    <li className="px-3 py-2 text-sm text-neutral-500">
                                        Loading…
                                    </li>
                                )}
                            {selectedEventId && error && (
                                <li className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                                    Failed to load members
                                </li>
                            )}
                            {selectedEventId &&
                                !isLoading &&
                                !error &&
                                filtered.length === 0 && (
                                    <li className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                                        No matches found
                                    </li>
                                )}
                            {selectedEventId &&
                                !isLoading &&
                                !error &&
                                filtered.map((m) => (
                                    <li
                                        key={m.id}
                                        role="option"
                                        aria-selected={selected?.id === m.id}
                                        className="cursor-pointer px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(m)}
                                    >
                                        <div className="text-sm font-medium dark:text-neutral-100">
                                            {m.full_name ??
                                                `${m.first_name} ${m.last_name}`}
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-md border border-neutral-200 p-3 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-200">
                    Selected:{' '}
                    {selected ? (
                        <>
                            <span className="font-medium">
                                {selected.full_name ??
                                    `${selected.first_name} ${selected.last_name}`}
                            </span>
                            {selectedEvent ? (
                                <>
                                    {' '}
                                    for{' '}
                                    <span className="font-medium">
                                        {selectedEvent.name}
                                    </span>
                                </>
                            ) : null}
                        </>
                    ) : selectedEvent ? (
                        <>
                            <span className="opacity-60">—</span> for{' '}
                            <span className="font-medium">
                                {selectedEvent.name}
                            </span>
                        </>
                    ) : (
                        <span className="opacity-60">—</span>
                    )}
                </div>

                <button
                    type="button"
                    disabled={!selectedEventId || !selected}
                    onClick={handleBegin}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                    Begin
                </button>
            </div>
        </main>
    )
}
