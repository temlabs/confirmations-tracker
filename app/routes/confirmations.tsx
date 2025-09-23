import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'
import { ConfirmationListItem } from '~/src/confirmation/components/ConfirmationListItem'
import { useFetchMembers } from '~/src/member/useFetchMembers'

export const meta = () => [{ title: 'All Confirmations' }]

export default function Confirmations() {
    const navigate = useNavigate()
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

    const { data, isLoading, error } = useFetchConfirmations(
        event
            ? {
                  equals: { event_id: event.id },
                  orderBy: { column: 'created_at', ascending: false },
                  limit: 100,
              }
            : undefined,
        { enabled: !!event }
    )

    useEffect(() => {
        if (loaded && !event) navigate('/identity', { replace: true })
    }, [loaded, event, navigate])

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">All Confirmations</h1>
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
                        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {data!.map((c) => (
                                <ConfirmationListItem
                                    key={c.id}
                                    confirmation={c}
                                    byline={`Confirmed by ${memberIdToName.get(c.confirmed_by_member_id) ?? 'Unknown'}`}
                                />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}
