import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LabelList,
} from 'recharts'
import type { Tables } from '~/types/database.types'
import { useFetchBacentaTargets } from '~/src/bacenta/useFetchBacentaTargets'
import { useFetchEventMembers } from '~/src/event/useFetchEventMembers'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'

type BacentaTargetsRow = Tables<'event_bacenta_targets_view'>

export function ConfirmationsByBacentaBarChart({
    eventId,
}: {
    eventId: string
}) {
    const {
        data: targets,
        isLoading,
        error,
    } = useFetchBacentaTargets(
        {
            equals: { event_id: eventId },
            orderBy: { column: 'confirmations_target', ascending: false },
        },
        { includeBacentaName: true }
    )

    // Fetch members with bacenta names to map confirmations to bacentas
    const { data: eventMembers } = useFetchEventMembers(
        { equals: { event_id: eventId } },
        { includeBacentaName: true }
    )

    // Fetch confirmed contacts for this event (confirmed_at IS NOT NULL)
    const { data: confirmed } = useFetchConfirmations(
        { equals: { event_id: eventId } },
        { scopeToCurrentEvent: false }
    )

    if (isLoading) {
        return (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Loading chart…
            </div>
        )
    }
    if (error) {
        return (
            <div className="text-sm text-red-600 dark:text-red-400">
                Failed to load chart
            </div>
        )
    }

    // Build mapping: member_id -> bacenta_name
    const memberToBacenta = new Map<string, string>()
    for (const m of eventMembers ?? []) {
        const name = (m as any).bacenta_name ?? null
        if (name && m.member_id)
            memberToBacenta.set(m.member_id as string, name)
    }

    // Aggregate confirmed contacts by bacenta
    const byBacenta = new Map<
        string,
        { total: number; firstTimers: number; target: number }
    >()
    // Initialize from targets to ensure ordering and target presence
    for (const t of targets ?? []) {
        const name = (t as any).bacenta_name ?? 'Unknown'
        byBacenta.set(name, {
            total: 0,
            firstTimers: 0,
            target: t.confirmations_target ?? 0,
        })
    }
    for (const c of confirmed ?? []) {
        const memberId = c.contacted_by_member_id as string
        const bacenta = memberToBacenta.get(memberId) ?? 'Unknown'
        const entry = byBacenta.get(bacenta) ?? {
            total: 0,
            firstTimers: 0,
            target: 0,
        }
        entry.total += 1
        if (c.is_first_time) entry.firstTimers += 1
        byBacenta.set(bacenta, entry)
    }

    const chartData = Array.from(byBacenta.entries())
        .map(([name, { total, firstTimers, target }]) => {
            const nonFirstTimers = Math.max(0, total - firstTimers)
            const pct =
                target > 0
                    ? Math.min(100, Math.round((total / target) * 100))
                    : 0
            const firstTimersPct =
                target > 0
                    ? Math.min(100, Math.round((firstTimers / target) * 100))
                    : 0
            const nonFirstTimersPct =
                target > 0
                    ? Math.min(100, Math.round((nonFirstTimers / target) * 100))
                    : 0
            return {
                name,
                pct,
                total,
                target,
                firstTimers,
                nonFirstTimers,
                firstTimersPct,
                nonFirstTimersPct,
            }
        })
        .sort((a, b) => b.pct - a.pct)

    const isDark =
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')

    return (
        <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Confirmations by Bacenta (First Timers vs Returning)
            </div>
            <div className="h-64 w-full text-neutral-800 dark:text-neutral-100">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 16, bottom: 32 }}
                    >
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: 'currentColor' }}
                            axisLine={false}
                            tickLine={false}
                            angle={-30}
                            textAnchor="end"
                            interval={0}
                            height={40}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: 'currentColor' }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                            domain={[0, 100]}
                            tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                            cursor={{
                                fill: isDark
                                    ? 'rgba(255,255,255,0.06)'
                                    : 'rgba(0,0,0,0.05)',
                            }}
                            contentStyle={{
                                fontSize: 12,
                                borderRadius: 6,
                                backgroundColor: isDark
                                    ? 'rgba(17,24,39,0.95)'
                                    : 'rgba(255,255,255,0.95)',
                                color: isDark ? '#e5e7eb' : '#111827',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                            }}
                            formatter={(value: number, name: string, props) => {
                                const payload = props?.payload as
                                    | {
                                          total: number
                                          target: number
                                          pct: number
                                          firstTimers: number
                                          nonFirstTimers: number
                                          firstTimersPct: number
                                          nonFirstTimersPct: number
                                      }
                                    | undefined
                                if (!payload) return [`${value}%`, '']

                                if (name === 'firstTimersPct') {
                                    return [
                                        `${payload.firstTimers}`,
                                        'First timers',
                                    ]
                                } else if (name === 'nonFirstTimersPct') {
                                    return [
                                        `${payload.nonFirstTimers}`,
                                        'Returning',
                                    ]
                                }

                                return [
                                    `${payload.total}/${payload.target} (${payload.pct}%)`,
                                    'Total confirmations',
                                ]
                            }}
                            labelFormatter={(label: string) => label}
                            separator={' • '}
                        />
                        <Bar
                            dataKey="firstTimersPct"
                            stackId="a"
                            fill="#f97316"
                        />
                        <Bar
                            dataKey="nonFirstTimersPct"
                            stackId="a"
                            fill="#1d4ed8"
                        >
                            <LabelList
                                dataKey="total"
                                position="top"
                                formatter={(v: number) => `${v}`}
                                style={{ fontSize: 12, fill: 'currentColor' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
