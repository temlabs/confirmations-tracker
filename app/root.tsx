import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    NavLink,
} from 'react-router'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './app.css'

export const links = () => [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
    },
    {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
    },
]

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    const [queryClient] = useState(() => new QueryClient())
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    return (
        <QueryClientProvider client={queryClient}>
            {/* Mobile top bar */}
            <div className="md:hidden">
                <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="fixed left-3 top-3 z-40 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white p-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                    aria-label="Open menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:block">
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    Navigation
                </div>
                <nav className="mt-3 flex flex-col gap-1">
                    <NavItem to="/" label="Your Confirmations" />
                    <NavItem
                        to="/confirmations"
                        label="View All Confirmations"
                    />
                    <NavItem to="/data" label="Data" />
                </nav>
            </aside>

            {/* Mobile drawer */}
            {isDrawerOpen ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsDrawerOpen(false)}
                        aria-hidden
                    />
                    <div className="relative h-full w-64 max-w-[80%] border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                Navigation
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                Close
                            </button>
                        </div>
                        <nav className="flex flex-col gap-1">
                            <NavItem
                                to="/"
                                label="Your Confirmations"
                                onNavigate={() => setIsDrawerOpen(false)}
                            />
                            <NavItem
                                to="/confirmations"
                                label="View All Confirmations"
                                onNavigate={() => setIsDrawerOpen(false)}
                            />
                            <NavItem
                                to="/data"
                                label="Data"
                                onNavigate={() => setIsDrawerOpen(false)}
                            />
                        </nav>
                    </div>
                </div>
            ) : null}

            {/* Content area with left padding on desktop and top spacing on mobile */}
            <div className="pt-12 md:pt-0 md:pl-56">
                <Outlet />
            </div>
        </QueryClientProvider>
    )
}

export function ErrorBoundary({ error }: { error: unknown }) {
    let message = 'Oops!'
    let details = 'An unexpected error occurred.'
    let stack: string | undefined

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error'
        details =
            error.status === 404
                ? 'The requested page could not be found.'
                : error.statusText || details
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message
        stack = error.stack
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    )
}

function NavItem({
    to,
    label,
    onNavigate,
}: {
    to: string
    label: string
    onNavigate?: () => void
}) {
    return (
        <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
                'rounded-md px-3 py-2 text-sm ' +
                (isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-neutral-800 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-800')
            }
            end={to === '/'}
        >
            {label}
        </NavLink>
    )
}
