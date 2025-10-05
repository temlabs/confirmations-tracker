import type { Tables } from '~/types/database.types'
import { useState } from 'react'
import { getRelativeTime } from '~/src/formatting/dateTime/getRelativeTime'

type Member = Tables<'members'>

export type MemberListItemProps = {
    member: Member
    bacentaName?: string | null
    totalConfirmations: number
    confirmationsTarget: number | null
    lastConfirmationAt?: string | null
    onPress?: () => void
}

export function MemberListItem({
    member,
    bacentaName,
    totalConfirmations,
    confirmationsTarget,
    lastConfirmationAt,
    onPress,
}: MemberListItemProps) {
    const name = member.full_name ?? `${member.first_name} ${member.last_name}`
    const target =
        typeof confirmationsTarget === 'number' ? confirmationsTarget : 0
    const percent =
        target > 0
            ? Math.min(100, Math.round((totalConfirmations / target) * 100))
            : 0
    const [showAbsolute, setShowAbsolute] = useState(false)
    const lastLabel = lastConfirmationAt
        ? showAbsolute
            ? new Date(lastConfirmationAt).toLocaleString()
            : getRelativeTime(lastConfirmationAt)
        : '—'

    return (
        <li className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
            <button
                type="button"
                onClick={onPress}
                className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
                disabled={!onPress}
            >
                <div className="min-w-0">
                    <div className="truncate text-sm font-medium dark:text-neutral-100">
                        {name}
                    </div>
                    <div className="truncate text-xs text-neutral-500">
                        {bacentaName ?? 'No bacenta'}
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowAbsolute((s) => !s)
                        }}
                        className="truncate text-left text-xs text-neutral-500 hover:underline"
                        title={lastConfirmationAt ?? ''}
                    >
                        Last confirmation: {lastLabel}
                    </button>
                </div>
                <div className="text-right">
                    <div className="text-sm font-semibold">
                        {totalConfirmations}
                        {target > 0 ? (
                            <span className="text-neutral-500">/ {target}</span>
                        ) : null}
                    </div>
                    {target > 0 ? (
                        <div className="text-xs text-neutral-500">
                            {percent}%
                        </div>
                    ) : null}
                </div>
            </button>
        </li>
    )
}
