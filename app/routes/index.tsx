import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { IdentityHeader } from '~/src/components/identityHeader/IdentityHeader'

import { useFetchCurrentMember } from '~/src/member/useFetchCurrentMember'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchEventMembers } from '~/src/event/useFetchEventMembers'

import { HeroButton } from '~/src/components/heroButton/HeroButton'
import { LinkButton } from '~/src/components/linkButton/LinkButton'

export const meta = () => [{ title: 'Add a Confirmation' }]

export default function Index() {
    const navigate = useNavigate()
    const { member, loaded } = useFetchCurrentMember()
    const { event } = useFetchCurrentEvent()

    const {
        data: targets,
        isLoading: targetsLoading,
        error: targetsError,
    } = useFetchEventMembers(
        member && event
            ? { equals: { event_id: event.id, member_id: member.id } }
            : undefined,
        { enabled: !!member && !!event }
    )

    useEffect(() => {
        if (loaded && !member) navigate('/identity', { replace: true })
    }, [member, loaded, navigate])

    function handleChangeMember() {
        navigate('/identity')
    }

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                <h1 className="text-xl font-semibold">Add a Confirmation</h1>
                {member ? (
                    <div className="mt-4">
                        <IdentityHeader
                            member={member}
                            event={event}
                            onChangeMember={handleChangeMember}
                        />
                        {/* Hero stats */}
                        <section className="mt-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                            {(!event || targetsLoading) && (
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {targetsLoading
                                        ? 'Loading your progress…'
                                        : 'Select an event to see your progress.'}
                                </p>
                            )}
                            {event && !targetsLoading && !targetsError && (
                                <HeroProgress
                                    total={
                                        targets?.[0]?.total_confirmations ?? 0
                                    }
                                    target={
                                        targets?.[0]?.confirmations_target ?? 0
                                    }
                                />
                            )}
                            {targetsError && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Failed to load your progress
                                </p>
                            )}
                        </section>
                    </div>
                ) : (
                    <div className="mt-4 rounded-md border border-neutral-200 p-4 text-sm text-neutral-700">
                        No member selected.{' '}
                        <button
                            type="button"
                            className="underline"
                            onClick={() => navigate('/identity')}
                        >
                            Choose your identity
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}

function HeroProgress({
    total,
    target,
}: {
    total: number
    target: number | null
}) {
    const safeTarget = typeof target === 'number' ? target : 0
    const percent =
        safeTarget > 0
            ? Math.min(100, Math.round((total / safeTarget) * 100))
            : 0
    return (
        <div>
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Your confirmations
                    </p>
                    <div className="mt-0.5 text-2xl font-semibold">
                        {safeTarget > 0 ? (
                            <span>
                                {total}{' '}
                                <span className="text-base font-normal text-neutral-500">
                                    / {safeTarget}
                                </span>
                            </span>
                        ) : (
                            <span>{total}</span>
                        )}
                    </div>
                </div>
                {safeTarget > 0 && (
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {percent}%
                    </div>
                )}
            </div>
            {safeTarget > 0 && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                        className="h-full bg-blue-600"
                        style={{ width: `${percent}%` }}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        role="progressbar"
                    />
                </div>
            )}
        </div>
    )
}
