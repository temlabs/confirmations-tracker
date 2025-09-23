import { useEffect, useState } from 'react'
import type { Tables } from '~/types/database.types'

type Event = Tables<'events'>

export function useFetchCurrentEvent(): {
    event: Event | null
    loaded: boolean
} {
    const [event, setEvent] = useState<Event | null>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ct.event')
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<Event> | null
                if (
                    parsed &&
                    typeof parsed === 'object' &&
                    parsed.id &&
                    parsed.name &&
                    parsed.event_timestamp
                ) {
                    setEvent(parsed as Event)
                }
            }
        } catch {}
        setLoaded(true)
    }, [])

    return { event, loaded }
}
