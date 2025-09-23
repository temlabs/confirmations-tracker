export function getRelativeTime(dateIso: string): string {
    const d = new Date(dateIso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffSec < 10) return 'just now'
    if (diffMin < 1) return `${diffSec}s ago`
    if (diffHr < 1) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
    if (diffDay < 1) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (
        d.getFullYear() === yesterday.getFullYear() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getDate() === yesterday.getDate()
    ) {
        return 'yesterday'
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ]

    const dayName = dayNames[d.getDay()]
    const monthName = monthNames[d.getMonth()]
    const day = d.getDate()
    const suffix = (n: number) => {
        const v = n % 100
        if (v >= 11 && v <= 13) return 'th'
        switch (n % 10) {
            case 1:
                return 'st'
            case 2:
                return 'nd'
            case 3:
                return 'rd'
            default:
                return 'th'
        }
    }

    const base = `${dayName} ${day}${suffix(day)} ${monthName}`
    if (d.getFullYear() !== now.getFullYear()) {
        return `${base} ${d.getFullYear()}`
    }
    return base
}

export function formatTimeRange(
    startIso: string,
    endIso: string
): { label: string; extraDays: number } {
    const start = new Date(startIso)
    const end = new Date(endIso)
    const extraDays = Math.max(
        0,
        Math.floor((end.getTime() - start.getTime()) / (24 * 3600 * 1000))
    )
    const timeFmt: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
    }
    const startLabel = start.toLocaleTimeString(undefined, timeFmt)
    const endLabel = end.toLocaleTimeString(undefined, timeFmt)
    return { label: `${startLabel} - ${endLabel}`, extraDays }
}

export function formatDuration(startIso: string, endIso: string): string {
    const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
    const totalMin = Math.max(0, Math.round(ms / 60000))
    const hours = Math.floor(totalMin / 60)
    const minutes = totalMin % 60
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
}
