import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
} from 'recharts'
import { useFetchCumulativeContacts } from '~/src/contact/useFetchCumulativeContacts'

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
    const { data, isLoading, error } = useFetchCumulativeContacts({
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
        contacts: row.cumulative_contacts ?? 0,
        confirmed: row.cumulative_confirmed ?? 0,
        transport: row.cumulative_transport_arranged ?? 0,
    }))

    const maxSeriesValue = chartData.reduce((acc, d) => {
        const localMax = Math.max(d.contacts, d.confirmed, d.transport)
        return Math.max(acc, localMax)
    }, 0)

    const yMax =
        typeof confirmationsTarget === 'number' && confirmationsTarget > 0
            ? Math.max(confirmationsTarget, maxSeriesValue)
            : maxSeriesValue > 0
              ? maxSeriesValue
              : undefined
    const refY =
        typeof attendanceTarget === 'number' && attendanceTarget > 0
            ? attendanceTarget
            : undefined

    return (
        <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Cumulative Contacts and Confirmations
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
                            dataKey="contacts"
                            name="Contacts"
                            stroke="#94a3b8"
                            fill="#94a3b880"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="confirmed"
                            name="Confirmed"
                            stroke="#2563eb"
                            fill="#2563eb55"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="transport"
                            name="Confirmed + Transport"
                            stroke="#16a34a"
                            fill="#16a34a55"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
