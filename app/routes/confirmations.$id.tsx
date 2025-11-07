import { useParams } from 'react-router'
import { useMemo, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFetchContactById } from '~/src/contact/useFetchContactById'
import { useUpdateContact } from '~/src/contact/useUpdateContact'
import type { Tables, TablesUpdate } from '~/types/database.types'
import { useFetchCallsByConfirmation } from '~/src/call/useFetchCallsByConfirmation'
import { useFetchVisitsByConfirmation } from '~/src/visit/useFetchVisitsByConfirmation'
import { useCreateCall } from '~/src/call/useCreateCall'
import { useUpdateCall } from '~/src/call/useUpdateCall'
import { useDeleteCall } from '~/src/call/useDeleteCall'
import { useCreateVisit } from '~/src/visit/useCreateVisit'
import { useUpdateVisit } from '~/src/visit/useUpdateVisit'
import { useDeleteVisit } from '~/src/visit/useDeleteVisit'
import { useFetchCallOutcomes } from '~/src/call/useFetchCallOutcomes'
import { useFetchMembers } from '~/src/member/useFetchMembers'
import { useFetchCurrentMember } from '~/src/member/useFetchCurrentMember'
import { useFetchContacts } from '~/src/contact/useFetchContacts'

type Confirmation = Tables<'contacts'>

export const meta = () => [{ title: 'Confirmation Details' }]

export default function ConfirmationDetail() {
    const { id } = useParams()
    const { data: confirmation, isLoading, error } = useFetchContactById(id)
    const { mutateAsync: updateAsync, isPending: updating } = useUpdateContact()

    const { data: calls } = useFetchCallsByConfirmation(id)
    const { data: visits } = useFetchVisitsByConfirmation(id)
    const { data: outcomes } = useFetchCallOutcomes()
    const { data: members } = useFetchMembers()
    const { member: currentMember } = useFetchCurrentMember()

    const [editing, setEditing] = useState(false)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [addType, setAddType] = useState<'' | 'call' | 'visit'>('')
    const [editingCallId, setEditingCallId] = useState<string | null>(null)
    const [editingVisitId, setEditingVisitId] = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!confirmation) return
        const form = e.currentTarget
        const formData = new FormData(form)
        const first_name = String(formData.get('first_name') || '').trim()
        const last_name = String(formData.get('last_name') || '').trim() || null
        const contact_number =
            String(formData.get('contact_number') || '').trim() || null
        const attended = formData.get('attended') === 'on'
        const is_first_time = formData.get('is_first_time') === 'on'
        const confirmedChecked = formData.get('confirmed_at') === 'on'
        const transportChecked = formData.get('transport_arranged_at') === 'on'
        const notes = String(formData.get('notes') || '').trim() || null
        if (!first_name) return
        const updates: TablesUpdate<'contacts'> = {
            first_name,
            last_name,
            contact_number,
            attended,
            is_first_time,
            notes,
            confirmed_at: confirmedChecked ? new Date().toISOString() : null,
            transport_arranged_at: transportChecked
                ? new Date().toISOString()
                : null,
        }
        try {
            await updateAsync({ id: confirmation.id, updates })
            setEditing(false)
        } catch {}
    }

    const timelineItems = useMemo(
        () => mergeTimeline(calls ?? [], visits ?? []),
        [calls, visits]
    )

    const { data: eventConfirmations } = useFetchContacts(
        confirmation
            ? { equals: { event_id: confirmation.event_id }, limit: 500 }
            : undefined,
        { enabled: !!confirmation }
    )

    return (
        <main className="min-h-[100svh] px-4 py-8">
            <div className="container mx-auto">
                {isLoading ? (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Loading…
                    </p>
                ) : error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Failed to load confirmation
                    </p>
                ) : !confirmation ? (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Not found
                    </p>
                ) : (
                    <div className="space-y-6">
                        <section className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold">
                                    {confirmation.first_name}{' '}
                                    {confirmation.last_name ?? ''}
                                </h1>
                                <button
                                    type="button"
                                    onClick={() => setEditing((v) => !v)}
                                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                >
                                    {editing ? 'Cancel' : 'Edit'}
                                </button>
                            </div>
                            <form
                                className="mt-3 space-y-3"
                                onSubmit={onSubmit}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label
                                            htmlFor="first_name"
                                            className="block text-sm font-medium"
                                        >
                                            First name
                                        </label>
                                        <input
                                            id="first_name"
                                            name="first_name"
                                            defaultValue={
                                                confirmation.first_name
                                            }
                                            required
                                            disabled={!editing}
                                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 disabled:dark:bg-neutral-950"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="last_name"
                                            className="block text-sm font-medium"
                                        >
                                            Last name
                                        </label>
                                        <input
                                            id="last_name"
                                            name="last_name"
                                            defaultValue={
                                                confirmation.last_name ?? ''
                                            }
                                            disabled={!editing}
                                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 disabled:dark:bg-neutral-950"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="notes"
                                        className="block text-sm font-medium"
                                    >
                                        Notes
                                    </label>
                                    {editing ? (
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={4}
                                            defaultValue={
                                                confirmation.notes ?? ''
                                            }
                                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm whitespace-pre-wrap text-neutral-800 dark:text-neutral-100">
                                            {confirmation.notes ?? '—'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="contact_number"
                                        className="block text-sm font-medium"
                                    >
                                        Contact number
                                    </label>
                                    <input
                                        id="contact_number"
                                        name="contact_number"
                                        defaultValue={
                                            confirmation.contact_number ?? ''
                                        }
                                        disabled={!editing}
                                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 disabled:dark:bg-neutral-950"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="attended"
                                            name="attended"
                                            type="checkbox"
                                            defaultChecked={
                                                confirmation.attended
                                            }
                                            disabled={!editing}
                                        />
                                        <label
                                            htmlFor="attended"
                                            className="text-sm"
                                        >
                                            Attended
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="is_first_time"
                                            name="is_first_time"
                                            type="checkbox"
                                            defaultChecked={
                                                confirmation.is_first_time
                                            }
                                            disabled={!editing}
                                        />
                                        <label
                                            htmlFor="is_first_time"
                                            className="text-sm"
                                        >
                                            First timer?
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="confirmed_at"
                                            name="confirmed_at"
                                            type="checkbox"
                                            defaultChecked={
                                                !!confirmation.confirmed_at
                                            }
                                            disabled={!editing}
                                        />
                                        <label
                                            htmlFor="confirmed_at"
                                            className="text-sm"
                                        >
                                            Confirmed
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="transport_arranged_at"
                                            name="transport_arranged_at"
                                            type="checkbox"
                                            defaultChecked={
                                                !!confirmation.transport_arranged_at
                                            }
                                            disabled={!editing}
                                        />
                                        <label
                                            htmlFor="transport_arranged_at"
                                            className="text-sm"
                                        >
                                            Transport arranged
                                        </label>
                                    </div>
                                </div>
                                {editing ? (
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                                        >
                                            {updating ? 'Saving…' : 'Save'}
                                        </button>
                                    </div>
                                ) : null}
                            </form>
                        </section>

                        <section className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                            <h2 className="text-base font-semibold">
                                Activity
                            </h2>
                            <ul className="mt-3">
                                {/* Ghost add item */}
                                <li
                                    className="relative flex items-start gap-3 rounded-md border border-dashed border-neutral-300 p-3 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 cursor-pointer"
                                    onClick={() => {
                                        setAddType('')
                                        setIsAddOpen(true)
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault()
                                            setAddType('')
                                            setIsAddOpen(true)
                                        }
                                    }}
                                >
                                    <div className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-neutral-100 text-blue-600 ring-2 ring-white dark:bg-neutral-800 dark:ring-neutral-900">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="m-1 h-4 w-4"
                                        >
                                            <path d="M12 5v14M5 12h14" />
                                        </svg>
                                    </div>
                                    <div className="ml-1 text-left text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Add new event
                                    </div>
                                </li>

                                {/* Existing items */}
                                {timelineItems.length === 0 ? (
                                    <li className="py-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        No activity yet.
                                    </li>
                                ) : (
                                    timelineItems.map((item) => (
                                        <li
                                            key={item.key}
                                            className="relative flex gap-3 py-3"
                                        >
                                            <div
                                                className="relative mt-1 w-12 flex flex-col items-center"
                                                style={{
                                                    color: item.iconColor,
                                                }}
                                            >
                                                <div
                                                    className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-neutral-200 dark:bg-neutral-800"
                                                    aria-hidden
                                                />
                                                <div
                                                    className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-white dark:bg-neutral-900"
                                                    aria-hidden
                                                />
                                                <div className="relative z-20 h-6 w-6 flex-shrink-0 rounded-full bg-neutral-100 ring-2 ring-white dark:bg-neutral-800 dark:ring-neutral-900">
                                                    {item.icon}
                                                </div>
                                                <div className="relative z-20 mt-1 text-[10px] font-bold uppercase text-neutral-800 dark:text-neutral-200">
                                                    {formatDayMonth(
                                                        item.timestampMs
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-2 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                item.type ===
                                                                'call'
                                                            )
                                                                setEditingCallId(
                                                                    item.id
                                                                )
                                                            else
                                                                setEditingVisitId(
                                                                    item.id
                                                                )
                                                        }}
                                                        className="text-left text-sm font-medium hover:underline"
                                                    >
                                                        {item.title}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                item.type ===
                                                                'call'
                                                            )
                                                                setEditingCallId(
                                                                    item.id
                                                                )
                                                            else
                                                                setEditingVisitId(
                                                                    item.id
                                                                )
                                                        }}
                                                        className="rounded-md p-1 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                        aria-label="Edit"
                                                        title="Edit"
                                                    >
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
                                                </div>
                                                <div className="mt-1 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                                                    <div className="flex items-center gap-1">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <circle
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                            />
                                                            <path d="M12 6v6l4 2" />
                                                        </svg>
                                                        <span>
                                                            {item.whenString}
                                                        </span>
                                                    </div>
                                                    {item.type === 'call' ? (
                                                        <div className="flex items-center gap-1">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                            <span>
                                                                {item.outcome ??
                                                                    'Unknown outcome'}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                    {item.type === 'visit' &&
                                                    item.visitorsList
                                                        ?.length ? (
                                                        <div className="flex items-center gap-1">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                                <circle
                                                                    cx="9"
                                                                    cy="7"
                                                                    r="4"
                                                                />
                                                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                            <span>
                                                                {item.visitorsList.join(
                                                                    ', '
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                    {item.type === 'visit' &&
                                                    item.location ? (
                                                        <div className="flex items-center gap-1">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z" />
                                                                <circle
                                                                    cx="12"
                                                                    cy="10"
                                                                    r="3"
                                                                />
                                                            </svg>
                                                            <span>
                                                                {item.location}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                                {item.body ? (
                                                    <div className="mt-2 text-sm whitespace-pre-wrap dark:text-neutral-100">
                                                        {item.body}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </section>

                        {/* Add event modal */}
                        {isAddOpen && confirmation && (
                            <AddEventModal
                                confirmationId={confirmation.id}
                                outcomes={outcomes ?? []}
                                members={members ?? []}
                                currentMemberId={currentMember?.id ?? null}
                                confirmations={eventConfirmations ?? []}
                                onClose={() => setIsAddOpen(false)}
                                onSelectType={(t) => setAddType(t)}
                                type={addType}
                            />
                        )}

                        {/* Edit modals */}
                        {editingCallId && (
                            <EditCallModal
                                callId={editingCallId}
                                calls={calls ?? []}
                                outcomes={outcomes ?? []}
                                members={members ?? []}
                                onClose={() => setEditingCallId(null)}
                            />
                        )}
                        {editingVisitId && confirmation && (
                            <EditVisitModal
                                visitId={editingVisitId}
                                visits={visits ?? []}
                                members={members ?? []}
                                confirmations={eventConfirmations ?? []}
                                confirmationId={confirmation.id}
                                onClose={() => setEditingVisitId(null)}
                            />
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}

function mergeTimeline(
    calls: ReturnType<typeof mapCalls> extends infer T ? any[] : any,
    visits: ReturnType<typeof mapVisits> extends infer U ? any[] : any
) {
    const mapped = [...mapCalls(calls as any[]), ...mapVisits(visits as any[])]
    mapped.sort((a, b) => b.timestampMs - a.timestampMs)
    return mapped
}

function AddEventModal({
    confirmationId,
    outcomes,
    members,
    currentMemberId,
    confirmations,
    onClose,
    onSelectType,
    type,
}: {
    confirmationId: string
    outcomes: Array<Tables<'call_outcomes'>>
    members: Array<Tables<'members'>>
    currentMemberId: string | null
    confirmations: Array<Tables<'contacts'>>
    onClose: () => void
    onSelectType: (t: 'call' | 'visit') => void
    type: '' | 'call' | 'visit'
}) {
    const { mutateAsync: createCall, isPending: creatingCall } = useCreateCall()
    const { mutateAsync: createVisit, isPending: creatingVisit } =
        useCreateVisit()
    const qc = useQueryClient()

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!type) return
        const fd = new FormData(e.currentTarget)
        const notes = String(fd.get('notes') || '').trim() || null

        if (type === 'call') {
            const caller_member_id = String(fd.get('caller_member_id') || '')
            const outcome_id = String(fd.get('outcome_id') || '') || null
            const call_timestamp = String(fd.get('call_timestamp') || '')
            if (!caller_member_id || !call_timestamp) return
            await createCall({
                callee_contact_id: confirmationId,
                caller_member_id,
                call_timestamp,
                outcome_id: outcome_id || null,
                notes,
            } as any)
            // Invalidate after finished
            qc.invalidateQueries({ queryKey: ['calls', { confirmationId }] })
            onClose()
        } else {
            const visit_timestamp = String(fd.get('visit_timestamp') || '')
            const location = String(fd.get('location') || '').trim() || null
            const visitorMemberIds =
                (fd.getAll('visitor_member_ids') as string[]) || []
            const extraVisiteeIds =
                (fd.getAll('extra_visitee_ids') as string[]) || []
            if (!visit_timestamp) return
            await createVisit({
                visit: {
                    visit_timestamp,
                    location,
                    notes,
                } as any,
                visitorMemberIds,
                visiteeConfirmationId: confirmationId,
                extraVisiteeIds,
            })
            qc.invalidateQueries({ queryKey: ['visits', { confirmationId }] })
            onClose()
        }
    }

    const defaultDateTime = new Date().toISOString().slice(0, 16)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden
            />
            <div className="relative w-full max-w-lg rounded-md border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Add new event</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        Close
                    </button>
                </div>

                <form className="mt-3 space-y-3" onSubmit={onSubmit}>
                    <div>
                        <label className="block text-sm font-medium">
                            Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) =>
                                onSelectType(e.target.value as 'call' | 'visit')
                            }
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        >
                            <option value="">Select…</option>
                            <option value="call">Call</option>
                            <option value="visit">Visit</option>
                        </select>
                    </div>

                    {type === 'call' ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium">
                                        When
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="call_timestamp"
                                        defaultValue={defaultDateTime}
                                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        Outcome
                                    </label>
                                    <select
                                        name="outcome_id"
                                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                                    >
                                        <option value="">Select…</option>
                                        {(outcomes ?? []).map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">
                                    Caller
                                </label>
                                <select
                                    name="caller_member_id"
                                    defaultValue={currentMemberId ?? ''}
                                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                                >
                                    <option value="">Select…</option>
                                    {(members ?? []).map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.full_name ??
                                                `${m.first_name} ${m.last_name}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : null}

                    {type === 'visit' ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium">
                                        When
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="visit_timestamp"
                                        defaultValue={defaultDateTime}
                                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="Optional"
                                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                                    />
                                </div>
                            </div>
                            <VisitorsTypeahead
                                name="visitor_member_ids"
                                allMembers={members ?? []}
                            />
                            <VisiteesTypeahead
                                name="extra_visitee_ids"
                                allConfirmations={confirmations ?? []}
                                excludeIds={[confirmationId]}
                            />
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-sm font-medium">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            rows={4}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                (type === 'call' && creatingCall) ||
                                (type === 'visit' && creatingVisit)
                            }
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditCallModal({
    callId,
    calls,
    outcomes,
    members,
    onClose,
}: {
    callId: string
    calls: any[]
    outcomes: Array<Tables<'call_outcomes'>>
    members: Array<Tables<'members'>>
    onClose: () => void
}) {
    const call = calls.find((c) => c.id === callId)
    const { mutateAsync: updateCall, isPending: updating } = useUpdateCall()
    const { mutateAsync: deleteCall, isPending: deleting } = useDeleteCall()

    if (!call) return null

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const payload: TablesUpdate<'calls'> = {
            call_timestamp: String(fd.get('call_timestamp') || ''),
            outcome_id: (String(fd.get('outcome_id') || '') || null) as any,
            caller_member_id: String(fd.get('caller_member_id') || ''),
            notes: String(fd.get('notes') || '').trim() || null,
        }
        await updateCall({ id: call.id, updates: payload })
        onClose()
    }

    async function onDelete() {
        await deleteCall({
            id: call.id,
            confirmationId: call.callee_contact_id,
        })
        onClose()
    }

    const dt = call.call_timestamp
        ? new Date(call.call_timestamp).toISOString().slice(0, 16)
        : ''

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden
            />
            <div className="relative w-full max-w-lg rounded-md border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Edit call</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        Close
                    </button>
                </div>
                <form className="mt-3 space-y-3" onSubmit={onSubmit}>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium">
                                When
                            </label>
                            <input
                                type="datetime-local"
                                name="call_timestamp"
                                defaultValue={dt}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">
                                Outcome
                            </label>
                            <select
                                name="outcome_id"
                                defaultValue={call.outcome?.id ?? ''}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            >
                                <option value="">Select…</option>
                                {outcomes.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">
                            Caller
                        </label>
                        <select
                            name="caller_member_id"
                            defaultValue={call.caller?.id ?? ''}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        >
                            <option value="">Select…</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.full_name ??
                                        `${m.first_name} ${m.last_name}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            rows={4}
                            defaultValue={call.notes ?? ''}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        />
                    </div>
                    <div className="flex justify-between pt-2">
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={deleting}
                            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                        >
                            Delete
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditVisitModal({
    visitId,
    visits,
    members,
    confirmations,
    confirmationId,
    onClose,
}: {
    visitId: string
    visits: any[]
    members: Array<Tables<'members'>>
    confirmations: Array<Tables<'contacts'>>
    confirmationId: string
    onClose: () => void
}) {
    const visit = visits.find((v) => v.id === visitId)
    const { mutateAsync: updateVisit, isPending: updating } = useUpdateVisit()
    const { mutateAsync: deleteVisit, isPending: deleting } = useDeleteVisit()
    const qc = useQueryClient()
    const chainRef = useRef<Promise<void>>(Promise.resolve())

    if (!visit) return null

    const currentVisitorIds = new Set<string>(
        (visit.visitors ?? []).map((m: any) => m.id)
    )
    const dt = visit.visit_timestamp
        ? new Date(visit.visit_timestamp).toISOString().slice(0, 16)
        : ''

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const updates: TablesUpdate<'visits'> = {
            visit_timestamp: String(fd.get('visit_timestamp') || ''),
            location: (String(fd.get('location') || '').trim() || null) as any,
            notes: (String(fd.get('notes') || '').trim() || null) as any,
        }

        // Read selections for optimistic update
        const selectedVisitors = new Set<string>(
            fd.getAll('visitor_member_ids') as string[]
        )
        const selectedVisitees = new Set<string>(
            fd.getAll('extra_visitee_ids') as string[]
        )

        // Optimistically update cache
        qc.setQueryData(['visits', { confirmationId }], (old: any) => {
            if (!old) return old
            return (old as any[]).map((row) => {
                if (row.id !== visit?.id) return row
                const next: any = { ...row, ...updates }
                // visitors from members
                const membersById = new Map(
                    members.map((m) => [m.id as string, m])
                )
                next.visitors = Array.from(selectedVisitors).map((id) => {
                    const m = membersById.get(id)
                    return m
                        ? {
                              id: m.id,
                              first_name: m.first_name,
                              last_name: m.last_name,
                              full_name: m.full_name,
                          }
                        : { id, first_name: '', last_name: '', full_name: '' }
                })
                // visitees from confirmations + include main confirmation
                const confirmationsById = new Map(
                    confirmations.map((c) => [c.id as string, c])
                )
                const allVisiteeIds = [
                    confirmationId,
                    ...Array.from(selectedVisitees),
                ]
                next.visitees = allVisiteeIds
                    .map((id) => confirmationsById.get(id))
                    .filter(Boolean)
                    .map((c: any) => ({
                        id: c.id,
                        first_name: c.first_name,
                        last_name: c.last_name,
                    }))
                return next
            })
        })

        // Queue server updates sequentially
        chainRef.current = chainRef.current
            .then(async () => {
                await updateVisit({ id: visit!.id, updates })
                const supabase = (
                    await import('~/lib/supabase.client')
                ).getSupabaseBrowserClient()
                await supabase
                    .from('visit_visitors')
                    .delete()
                    .eq('visit_id', visit!.id)
                if (selectedVisitors.size > 0) {
                    await supabase.from('visit_visitors').insert(
                        Array.from(selectedVisitors).map((member_id) => ({
                            visit_id: visit!.id,
                            member_id,
                        }))
                    )
                }
                await supabase
                    .from('visit_visitees')
                    .delete()
                    .eq('visit_id', visit!.id)
                const toInsert = [
                    confirmationId,
                    ...Array.from(selectedVisitees),
                ].map((contact_id) => ({
                    visit_id: visit!.id,
                    contact_id,
                }))
                await supabase.from('visit_visitees').insert(toInsert)
            })
            .finally(() => {
                qc.invalidateQueries({
                    queryKey: ['visits', { confirmationId }],
                })
            })

        onClose()
    }

    async function onDelete() {
        await deleteVisit({ id: visit.id, confirmationId })
        onClose()
    }

    const initialVisitees = (visit.visitees ?? [])
        .map((c: any) => ({
            id: c.id as string,
            label: c.last_name
                ? `${c.first_name} ${c.last_name}`
                : c.first_name,
        }))
        .filter((c: any) => c.id !== confirmationId)

    const initialVisitors = (visit.visitors ?? []).map((m: any) => ({
        id: m.id as string,
        label: m.full_name ?? `${m.first_name} ${m.last_name}`,
    }))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden
            />
            <div className="relative w-full max-w-lg rounded-md border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Edit visit</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        Close
                    </button>
                </div>
                <form className="mt-3 space-y-3" onSubmit={onSubmit}>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium">
                                When
                            </label>
                            <input
                                type="datetime-local"
                                name="visit_timestamp"
                                defaultValue={dt}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                defaultValue={visit.location ?? ''}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
                    </div>
                    <VisitorsTypeahead
                        name="visitor_member_ids"
                        allMembers={members}
                        initial={initialVisitors}
                    />
                    <VisiteesTypeahead
                        name="extra_visitee_ids"
                        allConfirmations={confirmations}
                        excludeIds={[confirmationId]}
                        initial={initialVisitees}
                    />
                    <div>
                        <label className="block text-sm font-medium">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            rows={4}
                            defaultValue={visit.notes ?? ''}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        />
                    </div>
                    <div className="flex justify-between pt-2">
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={deleting}
                            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                        >
                            Delete
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

function mapCalls(rows: any[]) {
    return rows.map((c) => {
        const when = new Date(c.call_timestamp)
        const who =
            c.caller?.full_name ??
            `${c.caller?.first_name ?? ''} ${c.caller?.last_name ?? ''}`.trim()
        const outcome = c.outcome?.description ?? 'Unknown outcome'
        return {
            key: `call-${c.id}`,
            type: 'call' as const,
            id: c.id as string,
            updatedAt: new Date(c.updated_at).getTime(),
            timestampMs: new Date(c.call_timestamp).getTime(),
            title: `Called by: ${who || 'Unknown'}`,
            whenString: when.toLocaleString(),
            outcome,
            body: c.notes ?? '',
            iconColor: '#2563eb',
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 m-1"
                >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.3 1.76.54 2.6a2 2 0 0 1-.45 2.11L8 9a16 16 0 0 0 7 7l.57-.2a2 2 0 0 1 2.11.45c.84.24 1.71.42 2.6.54A2 2 0 0 1 22 16.92z" />
                </svg>
            ),
        }
    })
}

function mapVisits(rows: any[]) {
    return rows.map((v) => {
        const when = new Date(v.visit_timestamp)
        const visitors = (v.visitors ?? []).map(
            (m: any) => m.full_name ?? `${m.first_name} ${m.last_name}`.trim()
        )
        const title =
            visitors.length > 0
                ? `Visited by: ${visitors[0]}${visitors.length > 1 ? ` and ${visitors.length - 1} others` : ''}`
                : 'Visited'
        return {
            key: `visit-${v.id}`,
            type: 'visit' as const,
            id: v.id as string,
            updatedAt: new Date(v.updated_at).getTime(),
            timestampMs: new Date(v.visit_timestamp).getTime(),
            title,
            whenString: when.toLocaleString(),
            visitorsList: visitors,
            location: v.location ?? null,
            body: v.notes ?? '',
            iconColor: '#16a34a',
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 m-1"
                >
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
            ),
        }
    })
}

function VisitorsTypeahead({
    name,
    allMembers,
    initial = [] as Array<{ id: string; label: string }>,
}: {
    name: string
    allMembers: Array<Tables<'members'>>
    initial?: Array<{ id: string; label: string }>
}) {
    const [query, setQuery] = useState('')
    const [focused, setFocused] = useState(false)
    const [selected, setSelected] =
        useState<Array<{ id: string; label: string }>>(initial)
    const normalized = (allMembers ?? []).map((m) => ({
        id: m.id as string,
        label: m.full_name ?? `${m.first_name} ${m.last_name}`,
    }))
    const filtered = query.trim()
        ? normalized.filter((m) =>
              m.label.toLowerCase().includes(query.toLowerCase())
          )
        : []
    function add(id: string, label: string) {
        if (selected.some((s) => s.id === id)) return
        setSelected((prev) => [...prev, { id, label }])
        setQuery('')
    }
    function remove(id: string) {
        setSelected((prev) => prev.filter((s) => s.id !== id))
    }
    return (
        <div className="relative">
            <label className="block text-sm font-medium">
                Visitors ({selected.length})
            </label>
            <div className="mt-1 min-h-8">
                <div className="min-h-6 overflow-x-auto whitespace-nowrap">
                    {selected.map((s) => (
                        <span
                            key={s.id}
                            className="mr-1 inline-flex items-center gap-1 rounded-full border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700"
                        >
                            {s.label}
                            <button
                                type="button"
                                onClick={() => remove(s.id)}
                                className="rounded-full px-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                ×
                            </button>
                            <input type="hidden" name={name} value={s.id} />
                        </span>
                    ))}
                </div>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 100)}
                    placeholder="Type a name…"
                    className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                {focused && query.length > 0 && (
                    <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-neutral-200 bg-white text-sm dark:border-neutral-800 dark:bg-neutral-900">
                        {filtered.map((m) => (
                            <li key={m.id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => add(m.id, m.label)}
                                    className="block w-full px-3 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {m.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function VisiteesTypeahead({
    name,
    allConfirmations,
    excludeIds = [],
    initial = [] as Array<{ id: string; label: string }>,
}: {
    name: string
    allConfirmations: Array<Tables<'contacts'>>
    excludeIds?: string[]
    initial?: Array<{ id: string; label: string }>
}) {
    const [query, setQuery] = useState('')
    const [focused, setFocused] = useState(false)
    const [selected, setSelected] =
        useState<Array<{ id: string; label: string }>>(initial)
    const normalized = (allConfirmations ?? [])
        .filter((c) => !excludeIds.includes(c.id as string))
        .map((c) => ({
            id: c.id as string,
            label: c.last_name
                ? `${c.first_name} ${c.last_name}`
                : c.first_name,
        }))
    const filtered = query.trim()
        ? normalized.filter((c) =>
              c.label.toLowerCase().includes(query.toLowerCase())
          )
        : []
    function add(id: string, label: string) {
        if (selected.some((s) => s.id === id)) return
        setSelected((prev) => [...prev, { id, label }])
        setQuery('')
    }
    function remove(id: string) {
        setSelected((prev) => prev.filter((s) => s.id !== id))
    }
    return (
        <div className="relative">
            <label className="block text-sm font-medium">
                Other visitees ({selected.length})
            </label>
            <div className="mt-1 min-h-8">
                <div className="min-h-6 overflow-x-auto whitespace-nowrap">
                    {selected.map((s) => (
                        <span
                            key={s.id}
                            className="mr-1 inline-flex items-center gap-1 rounded-full border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700"
                        >
                            {s.label}
                            <button
                                type="button"
                                onClick={() => remove(s.id)}
                                className="rounded-full px-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                ×
                            </button>
                            <input type="hidden" name={name} value={s.id} />
                        </span>
                    ))}
                </div>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 100)}
                    placeholder="Type a name…"
                    className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                {focused && query.length > 0 && (
                    <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-neutral-200 bg-white text-sm dark:border-neutral-800 dark:bg-neutral-900">
                        {filtered.map((c) => (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => add(c.id, c.label)}
                                    className="block w-full px-3 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {c.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function formatDayMonth(ms: number): string {
    const d = new Date(ms)
    const day = d.getDate()
    const mon = d.toLocaleString(undefined, { month: 'short' }).toUpperCase()
    return `${day} ${mon}`
}
