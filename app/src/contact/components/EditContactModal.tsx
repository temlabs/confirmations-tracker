import { useLocation, useNavigate } from 'react-router'
import { useUpdateContact } from '~/src/contact/useUpdateContact'
import { useDeleteContact } from '~/src/contact/useDeleteContact'
import type { Tables, TablesUpdate } from '~/types/database.types'

type Contact = Tables<'contacts'>

export function EditContactModal({ contact }: { contact: Contact }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { mutateAsync: updateAsync, isPending: updating } = useUpdateContact()
    const { mutateAsync: deleteAsync, isPending: deleting } = useDeleteContact()

    const close = () => {
        const params = new URLSearchParams(location.search)
        params.delete('edit')
        navigate({ search: params.toString() ? `?${params.toString()}` : '' })
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
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
        try {
            const updates: TablesUpdate<'contacts'> = {
                first_name,
                last_name,
                contact_number,
                attended,
                is_first_time,
                notes,
                confirmed_at: confirmedChecked
                    ? new Date().toISOString()
                    : null,
                transport_arranged_at: transportChecked
                    ? new Date().toISOString()
                    : null,
            }
            await updateAsync({ id: contact.id, updates })
            close()
        } catch {}
    }

    async function onDelete() {
        try {
            await deleteAsync(contact.id)
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
                    <h2 className="text-lg font-semibold">Edit contact</h2>
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                        Close
                    </button>
                </div>
                <form className="mt-3 space-y-3" onSubmit={onSubmit}>
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
                                defaultValue={contact.first_name}
                                required
                                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
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
                                defaultValue={contact.last_name ?? ''}
                                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                            />
                        </div>
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
                            defaultValue={contact.contact_number ?? ''}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="notes"
                            className="block text-sm font-medium"
                        >
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={4}
                            defaultValue={contact.notes ?? ''}
                            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                id="attended"
                                name="attended"
                                type="checkbox"
                                defaultChecked={contact.attended}
                            />
                            <label htmlFor="attended" className="text-sm">
                                Attended
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="is_first_time"
                                name="is_first_time"
                                type="checkbox"
                                defaultChecked={contact.is_first_time}
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
                                defaultChecked={!!contact.confirmed_at}
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
                                defaultChecked={!!contact.transport_arranged_at}
                            />
                            <label
                                htmlFor="transport_arranged_at"
                                className="text-sm"
                            >
                                Transport arranged
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-between gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={deleting}
                            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                        >
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={close}
                                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                            >
                                {updating ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
