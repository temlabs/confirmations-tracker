export type LinkButtonProps = {
    text: string
    onPress?: () => void
}

export function LinkButton({ text, onPress }: LinkButtonProps) {
    return (
        <button
            type="button"
            onClick={onPress}
            className="inline-flex items-center gap-1 text-blue-700 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
            <span>{text}</span>
            <span aria-hidden>→</span>
        </button>
    )
}
