import type { ReactNode } from 'react'

export type HeroButtonProps = {
    text: string
    onPress?: () => void
    icon?: ReactNode
}

export function HeroButton({ text, onPress, icon }: HeroButtonProps) {
    return (
        <button
            type="button"
            onClick={onPress}
            className="w-full rounded-xl bg-blue-600 px-6 py-5 text-center text-lg font-semibold text-white shadow-lg hover:bg-blue-700 active:bg-blue-800"
        >
            <span className="inline-flex items-center gap-3">
                {icon}
                <span>{text}</span>
            </span>
        </button>
    )
}
