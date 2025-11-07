import { useLocation, useNavigate } from 'react-router'
import { useCreateContact } from '~/src/contact/useCreateContact'

export function AddContactModal({
    memberId,
    eventId,
}: {
    memberId: string
    eventId: string
}) {
    const navigate = useNavigate()
    const location = useLocation()
    const { mutateAsync, isPending } = useCreateContact()

    const close = () => {
        const params = new URLSearchParams(location.search)
        params.delete('add')
        navigate({ search: params.toString() ? `?${params.toString()}` : '' })
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        const firstName = String(formData.get('first_name') || '').trim()
        const lastName = String(formData.get('last_name') || '').trim() || null
        const contact =
            String(formData.get('contact_number') || '').trim() || null
        const is_first_time = formData.get('is_first_time') === 'on'
        const is_confirmed = formData.get('confirmed_at') === 'on'
        const is_transport_arranged =
            formData.get('transport_arranged_at') === 'on'
        const notes = String(formData.get('notes') || '').trim() || null
        if (!firstName) return
        try {
            await mutateAsync({
                event_id: eventId,
                contacted_by_member_id: memberId,
                first_name: firstName,
                last_name: lastName,
                contact_number: contact,
                is_first_time,
                notes,
                ...(is_confirmed
                    ? { confirmed_at: new Date().toISOString() }
                    : {}),
                ...(is_transport_arranged
                    ? { transport_arranged_at: new Date().toISOString() }
                    : {}),
            })
            close()
        } catch {}
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={close}
                aria-hidden
            />
            <div className="relative w-full max-w-md rounded-md border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Add contact</h2>
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        Close
                    </button>
                </div>
                <form className="mt-3 space-y-3" onSubmit={onSubmit}>
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
                            required
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            placeholder="e.g. John"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="last_name"
                            className="block text-sm font-medium"
                        >
                            Last name (optional)
                        </label>
                        <input
                            id="last_name"
                            name="last_name"
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            placeholder="e.g. Doe"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="contact_number"
                            className="block text-sm font-medium"
                        >
                            Contact number (optional)
                        </label>
                        <input
                            id="contact_number"
                            name="contact_number"
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            placeholder="e.g. +233..."
                            inputMode="tel"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="is_first_time"
                            name="is_first_time"
                            type="checkbox"
                        />
                        <label htmlFor="is_first_time" className="text-sm">
                            First timer?
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="confirmed_at"
                            name="confirmed_at"
                            type="checkbox"
                        />
                        <label htmlFor="confirmed_at" className="text-sm">
                            Confirmed
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="transport_arranged_at"
                            name="transport_arranged_at"
                            type="checkbox"
                        />
                        <label
                            htmlFor="transport_arranged_at"
                            className="text-sm"
                        >
                            Transport arranged
                        </label>
                    </div>
                    <div>
                        <label
                            htmlFor="notes"
                            className="block text-sm font-medium"
                        >
                            Notes (optional)
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={4}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            placeholder="Add any useful context…"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={close}
                            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                            {isPending ? 'Adding…' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
