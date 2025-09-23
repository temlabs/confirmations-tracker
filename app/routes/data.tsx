import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchEvents } from '~/src/event/useFetchEvents'
import { CumulativeConfirmationsChart } from '~/src/components/charts/CumulativeConfirmationsChart'
import { ConfirmationsByBacentaBarChart } from '~/src/components/charts/ConfirmationsByBacentaBarChart'

export const meta = () => [{ title: 'Event Data' }]

export default function Data() {
    const navigate = useNavigate()
    const { event, loaded } = useFetchCurrentEvent()

    const { data, isLoading, error } = useFetchEvents(
        event
            ? {
                  equals: { id: event.id },
                  limit: 1,
              }
            : undefined,
        { enabled: !!event }
    )

    useEffect(() => {
        if (loaded && !event) navigate('/identity', { replace: true })
    }, [loaded, event, navigate])

    const current = data?.[0]
    const confTotal = current?.total_confirmations ?? 0
    const confTarget = current?.total_confirmations_target ?? 0
    const attTotal = current?.total_attendees ?? 0
    const attTarget = current?.total_attendance_target ?? 0

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">Event Data</h1>
                <section className="mt-4 rounded-md border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                    {!event ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Select an event to view data.
                        </p>
                    ) : isLoading ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Loading…
                        </p>
                    ) : error ? (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            Failed to load event data
                        </p>
                    ) : (
                        <div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <MetricCard
                                    title="Total confirmations"
                                    total={confTotal}
                                    target={confTarget}
                                />
                            </div>
                            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                                Attendance target: {attTarget ?? 0}
                            </p>
                            <div className="mt-6">
                                <CumulativeConfirmationsChart
                                    eventId={event.id}
                                    confirmationsTarget={confTarget}
                                    attendanceTarget={attTarget}
                                />
                            </div>
                            <div className="mt-8">
                                <ConfirmationsByBacentaBarChart
                                    eventId={event.id}
                                />
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

function MetricCard({
    title,
    total,
    target,
}: {
    title: string
    total: number
    target: number | null
}) {
    const safeTarget = typeof target === 'number' ? target : 0
    const percent =
        safeTarget > 0
            ? Math.min(100, Math.round((total / safeTarget) * 100))
            : 0
    return (
        <div className="rounded-md p-4 text-left">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {title}
            </p>
            <div className="mt-1 text-4xl font-bold">
                {safeTarget > 0 ? (
                    <span>
                        {total}{' '}
                        <span className="text-base font-normal text-neutral-500">
                            / {safeTarget}
                        </span>
                    </span>
                ) : (
                    <span>{total}</span>
                )}
            </div>
            {safeTarget > 0 && (
                <div className="mt-3">
                    <div className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">
                        {percent}%
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                            className="h-full bg-blue-600"
                            style={{ width: `${percent}%` }}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent}
                            role="progressbar"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
