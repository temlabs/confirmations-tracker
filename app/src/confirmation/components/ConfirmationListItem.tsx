import type { Tables } from '~/types/database.types'

type Confirmation = Tables<'confirmations'>

export type ConfirmationListItemProps = {
    confirmation: Confirmation
    byline?: string
}

export function ConfirmationListItem({
    confirmation,
    byline,
}: ConfirmationListItemProps) {
    const fullName = confirmation.last_name
        ? `${confirmation.first_name} ${confirmation.last_name}`
        : confirmation.first_name
    const attended = confirmation.attended
    const createdAt = new Date(confirmation.created_at)
    const createdLabel = createdAt.toLocaleString()

    return (
        <li className="flex items-center justify-between gap-3 border-b border-neutral-100 py-2 last:border-b-0 dark:border-neutral-800">
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
            <div>
                <span
                    className={
                        'rounded-full px-2 py-0.5 text-xs ' +
                        (attended
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300')
                    }
                >
                    {attended ? 'Attended' : 'Confirmed'}
                </span>
            </div>
        </li>
    )
}
