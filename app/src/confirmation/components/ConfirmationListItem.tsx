import type { Tables } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

export type ConfirmationListItemProps = {
    confirmation: Confirmation
    byline?: string
    onPress?: () => void
}

export function ConfirmationListItem({
    confirmation,
    byline,
    onPress,
}: ConfirmationListItemProps) {
    const fullName = confirmation.last_name
        ? `${confirmation.first_name} ${confirmation.last_name}`
        : confirmation.first_name
    const attended = confirmation.attended
    const isFirstTime = confirmation.is_first_time
    const createdAt = new Date(confirmation.created_at)
    const createdLabel = createdAt.toLocaleString()

    return (
        <li
            className="flex cursor-pointer items-center justify-between gap-3 border-b border-neutral-100 py-2 last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
            onClick={onPress}
            role={onPress ? 'button' : undefined}
            tabIndex={onPress ? 0 : undefined}
            onKeyDown={(e) => {
                if (!onPress) return
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onPress()
                }
            }}
        >
            <div>
                <div className="text-sm font-medium dark:text-neutral-100">
                    {fullName}
                </div>
                {confirmation.contact_number ? (
                    <div className="text-xs text-neutral-500">
                        {confirmation.contact_number}
                    </div>
                ) : null}
                {byline ? (
                    <div className="text-xs text-neutral-500">{byline}</div>
                ) : null}
                <div className="text-xs text-neutral-500">{createdLabel}</div>
            </div>
            <div className="flex gap-1">
                {isFirstTime && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        First timer
                    </span>
                )}
                {attended && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        Attended
                    </span>
                )}
            </div>
        </li>
    )
}
