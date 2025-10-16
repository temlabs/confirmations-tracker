import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useLocation } from 'react-router'
import { IdentityHeader } from '~/src/components/identityHeader/IdentityHeader'

import { useFetchCurrentMember } from '~/src/member/useFetchCurrentMember'
import { useFetchCurrentEvent } from '~/src/event/useFetchCurrentEvent'
import { useFetchEventMembers } from '~/src/event/useFetchEventMembers'
import { AddConfirmationModal } from '~/src/confirmation/components/AddConfirmationModal'
import { useFetchConfirmations } from '~/src/confirmation/useFetchConfirmations'
import { ConfirmationListItem } from '~/src/confirmation/components/ConfirmationListItem'
import { EditConfirmationModal } from '~/src/confirmation/components/EditConfirmationModal'

import { HeroButton } from '~/src/components/heroButton/HeroButton'
import { LinkButton } from '~/src/components/linkButton/LinkButton'

export const meta = () => [{ title: 'Add a Confirmation' }]

export default function Index() {
    const navigate = useNavigate()
    const location = useLocation()
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

    const {
        data: recentConfirmations,
        isLoading: recentLoading,
        error: recentError,
    } = useFetchConfirmations(
        member && event
            ? {
                  equals: {
                      confirmed_by_member_id: member.id,
                      event_id: event.id,
                  },
                  orderBy: { column: 'created_at', ascending: false },
                  limit: 5,
              }
            : undefined,
        { enabled: !!member && !!event }
    )

    useEffect(() => {
        if (loaded && !member) navigate('/identity', { replace: true })
    }, [member, loaded, navigate])

    function handleChangeMember() {
        navigate('/identity')
    }

    function openAddConfirmationModal() {
        const params = new URLSearchParams(location.search)
        params.set('add', 'confirmation')
        navigate({ search: `?${params.toString()}` })
    }

    const isAddConfirmationOpen =
        new URLSearchParams(location.search).get('add') === 'confirmation'

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
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                                    onClick={openAddConfirmationModal}
                                    disabled={!member || !event}
                                >
                                    Add confirmation
                                </button>
                            </div>
                        </section>

                        {/* Recent confirmations */}
                        <section className="mt-6 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">
                                    Recent confirmations
                                </h2>
                                {member && (
                                    <LinkButton
                                        text="See all"
                                        onPress={() =>
                                            navigate(
                                                `/confirmations?members=${member.id}`
                                            )
                                        }
                                    />
                                )}
                            </div>
                            {!event || !member ? (
                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    Select an event and member to see
                                    confirmations.
                                </p>
                            ) : recentLoading ? (
                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    Loading…
                                </p>
                            ) : recentError ? (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    Failed to load confirmations
                                </p>
                            ) : (recentConfirmations?.length ?? 0) === 0 ? (
                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    You have no confirmations yet.
                                </p>
                            ) : (
                                <ul className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {recentConfirmations!.map((c) => (
                                        <ConfirmationListItem
                                            key={c.id}
                                            confirmation={c}
                                            onPress={() => {
                                                const next =
                                                    new URLSearchParams(
                                                        location.search
                                                    )
                                                next.set('edit', c.id)
                                                navigate({
                                                    search: `?${next.toString()}`,
                                                })
                                            }}
                                        />
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* Edit modal */}
                        {(() => {
                            const editId = new URLSearchParams(
                                location.search
                            ).get('edit')
                            if (!editId) return null
                            const current = (recentConfirmations ?? []).find(
                                (x) => x.id === editId
                            )
                            if (!current) return null
                            return (
                                <EditConfirmationModal confirmation={current} />
                            )
                        })()}

                        {isAddConfirmationOpen && member && event && (
                            <AddConfirmationModal
                                memberId={member.id}
                                eventId={event.id}
                            />
                        )}
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
