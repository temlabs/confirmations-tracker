import { useEffect, useState } from 'react'
import type { Tables } from '~/types/database.types'

type Member = Tables<'members'>

export function useFetchCurrentMember(): {
    member: Member | null
    loaded: boolean
} {
    const [member, setMember] = useState<Member | null>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ct.user')
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<Member> | null
                if (
                    parsed &&
                    typeof parsed === 'object' &&
                    parsed.id &&
                    parsed.first_name &&
                    parsed.last_name
                ) {
                    setMember(parsed as Member)
                } else if (
                    parsed &&
                    typeof parsed === 'object' &&
                    parsed.id &&
                    parsed.first_name
                ) {
                    // Backward compat if only partial data was stored earlier
                    setMember(parsed as Member)
                }
            }
        } catch {}
        setLoaded(true)
    }, [])

    return { member, loaded }
}
