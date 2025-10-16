import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LabelList,
} from 'recharts'
import { useFetchBacentaTargets } from '~/src/bacenta/useFetchBacentaTargets'

export function AttendanceProportionByBacentaBarChart({
    eventId,
}: {
    eventId: string
}) {
    const { data, isLoading, error } = useFetchBacentaTargets(
        {
            equals: { event_id: eventId },
            orderBy: { column: 'attendance_target', ascending: false },
        },
        { includeBacentaName: true, refetchInterval: 10000 }
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

    const chartData = (data ?? [])
        .map((r) => {
            const name = (r as any).bacenta_name ?? 'Unknown'
            const totalConfirmations = r.total_confirmations ?? 0
            const totalAttendees = r.total_attendees ?? 0
            const pct =
                totalConfirmations > 0
                    ? Math.min(
                          100,
                          Math.round(
                              (totalAttendees / totalConfirmations) * 100
                          )
                      )
                    : 0
            return {
                name,
                pct,
                totalAttendees,
                totalConfirmations,
            }
        })
        .sort((a, b) => b.pct - a.pct)

    const isDark =
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')

    return (
        <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Attendance Proportion by Bacenta
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
                                          totalAttendees: number
                                          totalConfirmations: number
                                          pct: number
                                      }
                                    | undefined
                                if (!payload) return [`${value}%`, '']
                                return [
                                    `${payload.totalAttendees}/${payload.totalConfirmations} (${payload.pct}%)`,
                                    'Attended / Confirmations',
                                ]
                            }}
                            labelFormatter={(label: string) => label}
                            separator={' • '}
                        />
                        <Bar dataKey="pct" fill="#16a34a">
                            <LabelList
                                dataKey="pct"
                                position="top"
                                formatter={(label) => {
                                    const value =
                                        typeof label === 'number'
                                            ? label
                                            : Number(label ?? 0)
                                    return `${isFinite(value) ? value : 0}%`
                                }}
                                style={{ fontSize: 12, fill: 'currentColor' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
