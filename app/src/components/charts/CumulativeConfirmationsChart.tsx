import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
} from 'recharts'
import { useFetchCumulativeConfirmations } from '~/src/confirmation/useFetchCumulativeConfirmations'

export type CumulativeConfirmationsChartProps = {
    eventId: string
    confirmationsTarget?: number | null
    attendanceTarget?: number | null
}

export function CumulativeConfirmationsChart({
    eventId,
    confirmationsTarget,
    attendanceTarget,
}: CumulativeConfirmationsChartProps) {
    const { data, isLoading, error } = useFetchCumulativeConfirmations({
        equals: { event_id: eventId },
        orderBy: { column: 'day', ascending: true },
    })

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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filtered = (data ?? []).filter((row) => {
        const d = row.day ? new Date(row.day) : null
        if (!d) return false
        d.setHours(0, 0, 0, 0)
        return d.getTime() <= today.getTime()
    })

    const chartData = filtered.map((row) => ({
        date: new Date(row.day ?? '').toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        }),
        value: row.cumulative_confirmations ?? 0,
    }))

    const yMax =
        typeof confirmationsTarget === 'number' && confirmationsTarget > 0
            ? confirmationsTarget
            : undefined
    const refY =
        typeof attendanceTarget === 'number' && attendanceTarget > 0
            ? attendanceTarget
            : undefined

    return (
        <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Cumulative Total Confirmations
            </div>
            <div className="h-56 w-full text-neutral-800 dark:text-neutral-100">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={30}
                            domain={[0, yMax ?? 'dataMax']}
                        />
                        <Tooltip
                            cursor={{
                                stroke: 'rgba(0,0,0,0.1)',
                                strokeWidth: 1,
                            }}
                            contentStyle={{ fontSize: 12, borderRadius: 6 }}
                            labelStyle={{ fontWeight: 600 }}
                        />
                        {refY !== undefined ? (
                            <ReferenceLine
                                y={refY}
                                stroke="#64748b"
                                strokeDasharray="4 4"
                                ifOverflow="extendDomain"
                            />
                        ) : null}
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            fill="#3b82f680"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
