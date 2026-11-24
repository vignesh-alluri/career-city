import { useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { LogOut, Search } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { ApplicationModals } from '@/components/applications/ApplicationModals'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { ShortcutHelp } from '@/components/layout/ShortcutHelp'
import { WaterCursor } from '@/components/effects/WaterCursor'
import { activeNavIndex, APP_NAV } from '@/config/appNav'
import { usePreferences } from '@/store/preferencesStore'
import { useApplyPreferences } from '@/hooks/useApplyPreferences'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'

const nav = APP_NAV
const ROW = 44   // px: the height of one station on the sidebar line (md and up). The line and the train are placed with this number.

/** A button that opens quick find, with the shortcut shown so people learn it. */
function QuickFindButton() {
  const openPalette = useUiStore((s) => s.openPalette)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <button
      type="button" onClick={openPalette} data-ripple="true"
      className="relative mx-3 mt-3 hidden items-center justify-between gap-2 overflow-hidden rounded-control border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-accent/50 hover:text-ink md:flex"
    >
      <span className="flex items-center gap-2"><Search size={16} aria-hidden /> Quick find</span>
      <kbd className="rounded border border-line bg-void/40 px-1.5 py-0.5 font-mono text-[11px]">{isMac ? '\u2318K' : 'Ctrl K'}</kbd>
    </button>
  )
}

/** Shows who is logged in and lets them log out. */
function AccountBlock() {
  const { user, signOut } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const handleLogout = async () => {
    setError(null); setBusy(true)
    try { await signOut() } // the auth listener clears cached data and <ProtectedRoute> sends us to /login
    catch (e) { setError(e instanceof Error ? e.message : 'Could not log out. Please try again.'); setBusy(false) }
  }
  return (
    <div className="m-3 rounded-control border border-line p-3 text-xs md:mt-auto">
      <p className="truncate text-muted" title={user?.email}>{user?.displayName ?? user?.email}</p>
      {user?.displayName && <p className="truncate text-muted/70">{user.email}</p>}
      {error && <p role="alert" className="mt-2 text-danger">{error}</p>}
      <button type="button" disabled={busy} onClick={handleLogout} className="mt-2 inline-flex items-center gap-2 text-sm text-ink underline-offset-2 hover:underline disabled:opacity-50">
        <LogOut size={14} aria-hidden /> {busy ? 'Logging out...' : 'Log out'}
      </button>
    </div>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const active = activeNavIndex(pathname)
  const palette = usePreferences((s) => s.palette)
  useApplyPreferences()
  useGlobalShortcuts()
  return (
    <div data-palette={palette} className="app-shell flex min-h-screen flex-col md:flex-row">
      <div aria-hidden className="app-glow" />
      <aside className="relative z-10 flex flex-col border-b border-line bg-surface shadow-[0_0_40px_-10px_rgb(0_0_0/0.8)] md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <Link to="/" className="block px-5 py-5 font-display text-lg font-semibold tracking-tight">
          CAREER <span className="text-accent">CITY</span>
        </Link>
        <nav aria-label="Main" className="relative flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-0 md:overflow-visible md:pb-0">
          {/* The metro line: a dim track through every station, a bright part up to the station you are at, and a small train
              resting just before it. Changing page makes the bright part grow and the train roll to the new station. */}
          <div aria-hidden className="pointer-events-none absolute top-[22px] left-[35px] hidden w-[3px] -translate-x-1/2 rounded-full bg-white/10 md:block" style={{ height: (nav.length - 1) * ROW }} />
          {active >= 0 && (
            <>
              <div
                aria-hidden className="pointer-events-none absolute top-[22px] left-[35px] hidden w-[3px] -translate-x-1/2 rounded-full bg-signal shadow-[0_0_10px_var(--color-signal)] transition-[height] duration-500 ease-out md:block"
                style={{ height: active * ROW }}
              />
              <div
                aria-hidden className="pointer-events-none absolute top-0 left-[35px] z-20 hidden -translate-x-1/2 transition-transform duration-500 ease-out md:block"
                style={{ transform: `translate(-50%, ${active * ROW - 11}px)` }}
              >
                <span className="train-v"><span className="car-v" /><span className="car-v" /></span>
              </div>
            </>
          )}
          {nav.map(({ to, label, end }, i) => {
            const isActive = i === active
            return (
              <NavLink
                key={to} to={to} end={end} data-ripple="true"
                className={cn(
                  'relative z-10 flex shrink-0 items-center gap-3 overflow-hidden rounded-control px-3 py-2 text-sm transition-colors md:h-11 md:py-0',
                  isActive ? 'bg-white/[0.07] text-ink' : 'text-muted hover:bg-white/5 hover:text-ink',
                )}
              >
                {/* a station on the line: numbered, lit when you are here, outlined once passed */}
                <span
                  aria-hidden
                  className={cn(
                    'flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-surface font-mono text-[10px] font-bold tabular-nums transition-colors duration-500',
                    isActive ? 'border-signal bg-signal text-void shadow-[0_0_12px_var(--color-signal)]' : i < active ? 'border-signal/70 text-signal' : 'border-white/25 text-muted',
                  )}
                >{i + 1}</span>
                {label}
              </NavLink>
            )
          })}
        </nav>
        <QuickFindButton />
        <AccountBlock />
      </aside>
      <main className="relative z-10 min-w-0 flex-1 p-6 md:p-10">
        {/* keyed by the address, so every page change replays the entrance animation */}
        <div key={pathname} className="page-enter"><Outlet /></div>
      </main>
      <ApplicationModals />
      <CommandPalette />
      <ShortcutHelp />
      <WaterCursor />
    </div>
  )
}
