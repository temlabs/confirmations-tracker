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

type BacentaTargetsRow = Tables<'event_bacenta_targets_view'>

export function ConfirmationsByBacentaBarChart({
    eventId,
}: {
    eventId: string
}) {
    const { data, isLoading, error } = useFetchBacentaTargets(
        {
            equals: { event_id: eventId },
            orderBy: { column: 'confirmations_target', ascending: false },
        },
        { includeBacentaName: true }
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
            const target = r.confirmations_target ?? 0
            const total = r.total_confirmations ?? 0
            const pct =
                target > 0
                    ? Math.min(100, Math.round((total / target) * 100))
                    : 0
            return { name, pct, total, target }
        })
        .sort((a, b) => b.pct - a.pct)

    const isDark =
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')

    return (
        <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Confirmations by Bacenta
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
                            formatter={(
                                value: number,
                                _name: string,
                                props
                            ) => {
                                const payload = props?.payload as
                                    | {
                                          total: number
                                          target: number
                                          pct: number
                                      }
                                    | undefined
                                if (!payload) return [`${value}%`, '']
                                return [
                                    `${payload.pct}%`,
                                    `${payload.total}/${payload.target}`,
                                ]
                            }}
                            labelFormatter={(label: string) => label}
                            separator={' • '}
                        />
                        <Bar dataKey="pct" fill="#2563eb">
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
