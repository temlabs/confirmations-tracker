import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchEvents } from '~/src/event/useFetchEvents'
import { useFetchContacts } from '~/src/contact/useFetchContacts'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'
import { AttendanceProportionByBacentaBarChart } from '../src/components/charts/AttendanceProportionByBacentaBarChart'
import { ContactListItem } from '~/src/contact/components/ContactListItem'

export const meta = () => [{ title: 'Live Attendance' }]

export default function LiveAttendance() {
    const navigate = useNavigate()
    const { event, loaded } = useFetchCurrentEvent()

    const { data: eventData } = useFetchEvents(
        event ? { equals: { id: event.id }, limit: 1 } : undefined,
        { enabled: !!event, refetchInterval: 10000 }
    )

    const { data: advancedConfirmations } = useFetchConfirmations(
        event ? { equals: { event_id: event.id } } : undefined,
        {
            enabled: !!event,
            refetchInterval: 10000,
            confirmationsWithTransportArrangedOnly: true,
        }
    )

    const {
        data: attendedConfirmations,
        isLoading: attendedLoading,
        error: attendedError,
    } = useFetchContacts(
        event
            ? {
                  equals: { event_id: event.id, attended: true },
              }
            : undefined,
        { enabled: !!event, refetchInterval: 10000 }
    )

    // Just arrived: last 5 confirmations that are attended, ordered by created_at DESC
    const { data: recentAttended } = useFetchContacts(
        event
            ? {
                  equals: { event_id: event.id, attended: true },
                  orderBy: { column: 'created_at', ascending: false },
                  limit: 5,
              }
            : undefined,
        { enabled: !!event, refetchInterval: 10000 }
    )

    useEffect(() => {
        if (loaded && !event) navigate('/identity', { replace: true })
    }, [loaded, event, navigate])

    const total = advancedConfirmations?.length ?? 0
    const attendedTotal = attendedConfirmations?.length ?? 0
    const percent =
        total > 0 ? Math.min(100, Math.round((attendedTotal / total) * 100)) : 0

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">Live Attendance</h1>

                {/* Headline */}
                <section className="mt-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    {!event ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Select an event to view live attendance.
                        </p>
                    ) : attendedLoading ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Loading…
                        </p>
                    ) : attendedError ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Failed to load attendance
                        </p>
                    ) : (
                        <div>
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Attended
                                    </p>
                                    <div className="mt-0.5 text-2xl font-semibold">
                                        {attendedTotal}{' '}
                                        <span className="text-base font-normal text-neutral-500">
                                            / {total}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {percent}%
                                </div>
                            </div>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                <div
                                    className="h-full bg-green-600"
                                    style={{ width: `${percent}%` }}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={percent}
                                    role="progressbar"
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Proportion chart */}
                {event && (
                    <section className="mt-6 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <AttendanceProportionByBacentaBarChart
                            eventId={event.id}
                        />
                    </section>
                )}

                {/* Just arrived */}
                <section className="mt-6 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">
                            Just arrived
                        </h2>
                        {event && (
                            <button
                                type="button"
                                className="text-sm font-medium text-blue-700 underline dark:text-blue-300"
                                onClick={() =>
                                    navigate('/contacts?attended=true')
                                }
                            >
                                See all
                            </button>
                        )}
                    </div>
                    {!event ? (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            Select an event to see arrivals.
                        </p>
                    ) : (recentAttended?.length ?? 0) === 0 ? (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            No arrivals yet.
                        </p>
                    ) : (
                        <ul className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
                            {recentAttended!.map((c) => (
                                <ContactListItem key={c.id} contact={c} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}
