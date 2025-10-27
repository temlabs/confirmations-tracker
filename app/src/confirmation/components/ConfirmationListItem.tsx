import type { Tables } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

export type ConfirmationListItemProps = {
    confirmation: Confirmation
    byline?: string
    onPress?: () => void
    onEdit?: () => void
}

export function ConfirmationListItem({
    confirmation,
    byline,
    onPress,
    onEdit,
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
            <div className="flex items-center gap-2">
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
                {onEdit ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit()
                        }}
                        aria-label="Edit confirmation"
                        title="Edit"
                        className="rounded-md p-1 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        {/* Pencil icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                    </button>
                ) : null}
            </div>
        </li>
    )
}
