import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchEvents } from '~/src/event/useFetchEvents'
import { useFetchBacentaTargets } from '~/src/bacenta/useFetchBacentaTargets'
import { useFetchEventMembers } from '~/src/event/useFetchEventMembers'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'
import { CumulativeConfirmationsChart } from '~/src/components/charts/CumulativeConfirmationsChart'
import { ConfirmationsByBacentaBarChart } from '~/src/components/charts/ConfirmationsByBacentaBarChart'

export const meta = () => [{ title: 'Event Data' }]

export default function Data() {
    const navigate = useNavigate()
    const { event, loaded } = useFetchCurrentEvent()
    const [copySuccess, setCopySuccess] = useState(false)

    const { data, isLoading, error } = useFetchEvents(
        event
            ? {
                  equals: { id: event.id },
                  limit: 1,
              }
            : undefined,
        { enabled: !!event }
    )

    // Fetch bacenta targets for the current event
    const { data: bacentaTargets } = useFetchBacentaTargets(
        event ? { equals: { event_id: event.id } } : undefined,
        { enabled: !!event, includeBacentaName: true }
    )

    // Fetch event members with bacenta names
    const { data: eventMembers } = useFetchEventMembers(
        event ? { equals: { event_id: event.id } } : undefined,
        { enabled: !!event, includeBacentaName: true }
    )

    // Fetch confirmations for the current event
    const { data: confirmations } = useFetchConfirmations(
        event ? { equals: { event_id: event.id } } : undefined,
        { enabled: !!event }
    )

    useEffect(() => {
        if (loaded && !event) navigate('/identity', { replace: true })
    }, [loaded, event, navigate])

    const formatWhatsAppText = () => {
        if (!event || !bacentaTargets || !eventMembers || !confirmations)
            return ''

        const now = new Date()
        const dateStr = now.toLocaleDateString('en-GB') // dd/MM/yy format
        const timeStr = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }) // hh:mm format

        let text = `*${event.name} Confirmations*\n_As of ${dateStr} at ${timeStr}_\n\n`

        // Group members by bacenta name
        const membersByBacenta = new Map<string, typeof eventMembers>()
        eventMembers.forEach((member) => {
            const bacentaName = member.bacenta_name
            if (bacentaName) {
                if (!membersByBacenta.has(bacentaName)) {
                    membersByBacenta.set(bacentaName, [])
                }
                membersByBacenta.get(bacentaName)!.push(member)
            }
        })

        // Process each bacenta
        bacentaTargets.forEach((bacenta) => {
            const bacentaName = bacenta.bacenta_name || 'Unknown Bacenta'
            const totalConfirmed = bacenta.total_confirmations || 0

            text += `*${bacentaName} - ${totalConfirmed}*\n`

            // Get members for this bacenta
            const bacentaMembers = membersByBacenta.get(bacentaName) || []

            bacentaMembers.forEach((member, index) => {
                const memberName = member.member_full_name || 'Unknown Member'
                const memberTarget = member.confirmations_target || 0

                // Count confirmations for this member
                const memberConfirmations = confirmations.filter(
                    (conf) => conf.confirmed_by_member_id === member.member_id
                ).length

                text += `${index + 1}. ${memberName} - ${memberConfirmations}/${memberTarget}\n`
            })

            text += '\n'
        })

        // Add total
        const totalConfirmations = confirmations.length
        const totalTarget = bacentaTargets.reduce(
            (sum, bacenta) => sum + (bacenta.confirmations_target || 0),
            0
        )
        text += `*Total - ${totalConfirmations}/${totalTarget}*`

        return text
    }

    const handleCopyToWhatsApp = async () => {
        const text = formatWhatsAppText()
        if (!text) return

        try {
            await navigator.clipboard.writeText(text)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    const current = data?.[0]
    const confTotal = current?.total_confirmations ?? 0
    const confTarget = current?.total_confirmations_target ?? 0
    const attTotal = current?.total_attendees ?? 0
    const attTarget = current?.total_attendance_target ?? 0
    const firstTimersTotal = current?.total_first_timers ?? 0

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Event Data</h1>
                    <button
                        onClick={handleCopyToWhatsApp}
                        disabled={
                            !event ||
                            !bacentaTargets ||
                            !eventMembers ||
                            !confirmations
                        }
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:bg-neutral-400 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#669468' }}
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        {copySuccess ? 'Copied!' : 'Copy to WhatsApp'}
                    </button>
                </div>
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
                                <FirstTimersCard total={firstTimersTotal} />
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

function FirstTimersCard({ total }: { total: number }) {
    return (
        <div className="rounded-md p-4 text-left">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Total first timers confirmed
            </p>
            <div className="mt-1 text-4xl font-bold">{total}</div>
        </div>
    )
}
