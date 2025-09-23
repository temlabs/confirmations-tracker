import type { Tables } from '~/types/database.types'
import type { Event } from '~/src/event/types'

type Member = Tables<'members'>

export type IdentityHeaderProps = {
    member: Member
    onChangeMember: () => void
    event: Event | null
}

export function IdentityHeader({
    member,
    onChangeMember,
    event,
}: IdentityHeaderProps) {
    const eventName = event?.name
    const eventDate = event?.event_timestamp

    let eventSuffix: string | null = null
    if (eventDate && eventName) {
        const eventTime = new Date(eventDate).getTime()
        const now = Date.now()
        const msPerDay = 1000 * 60 * 60 * 24
        const daysAway = Math.ceil((eventTime - now) / msPerDay)
        const formattedDate = new Date(eventDate).toLocaleDateString(
            undefined,
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }
        )
        if (!Number.isNaN(daysAway)) {
            eventSuffix = ` which is ${daysAway} day${Math.abs(daysAway) === 1 ? '' : 's'} away, on ${formattedDate}`
        }
    }

    return (
        <header className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
            <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Welcome,
                </p>
                <h2 className="text-lg font-semibold leading-tight">
                    {member.first_name}!
                </h2>
                {eventName ? (
                    <p className="text-xs text-neutral-600 mt-1 dark:text-neutral-400">
                        You are viewing and adding confirmations for the{' '}
                        <strong>{eventName}</strong> event
                        {eventSuffix ?? ''}.
                    </p>
                ) : null}
            </div>
            <button
                type="button"
                onClick={onChangeMember}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
            >
                Change
            </button>
        </header>
    )
}
