import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { APP_NAV } from '@/config/appNav'
import { useApplications } from '@/hooks/useTracker'
import { rankItems, type PaletteItem } from '@/lib/commandSearch'
import { ACCENTS, ACCENT_IDS } from '@/lib/preferences'
import { cn } from '@/lib/utils'
import { useModalStore } from '@/store/modalStore'
import { usePreferences } from '@/store/preferencesStore'
import { useUiStore } from '@/store/uiStore'
import { STATUS_LABELS } from '@/types'

interface Command extends PaletteItem { run: () => void }

/**
 * Quick find (Ctrl+K). One box to jump anywhere, add things, change the look, or open any of your applications by typing a bit
 * of the company or role. Ranking is done by lib/commandSearch.ts. Arrow keys move, Enter runs, Esc closes.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen)
  const close = useUiStore((s) => s.closePalette)
  const openHelp = useUiStore((s) => s.openHelp)
  const navigate = useNavigate()
  const openModal = useModalStore((s) => s.open)
  const apps = useApplications().data
  const accentNow = usePreferences((s) => s.accent)
  const density = usePreferences((s) => s.density)
  const water = usePreferences((s) => s.waterCursor)
  const update = usePreferences((s) => s.update)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => { if (open) { setQuery(''); setActive(0) } }, [open])

  const commands = useMemo<Command[]>(() => [
    { id: 'new-app', label: 'Add application', group: 'Actions', hint: 'N', keywords: 'create new internship', run: () => openModal({ kind: 'create', defaultStatus: 'saved' }) },
    { id: 'new-rem', label: 'Add reminder', group: 'Actions', hint: 'R', keywords: 'create new interview follow up', run: () => openModal({ kind: 'reminder' }) },
    ...APP_NAV.map((n): Command => ({ id: `go-${n.id}`, label: `Go to ${n.label}`, group: 'Go to', keywords: n.keywords, run: () => navigate(n.to) })),
    { id: 'help', label: 'Show keyboard shortcuts', group: 'Help', hint: '?', keywords: 'keys hotkeys', run: openHelp },
    ...ACCENT_IDS.filter((a) => a !== accentNow).map((a): Command => ({ id: `accent-${a}`, label: `Accent colour: ${ACCENTS[a].label}`, group: 'Appearance', keywords: 'theme colour color', run: () => update({ accent: a }) })),
    { id: 'density', label: density === 'compact' ? 'Use comfortable spacing' : 'Use compact spacing', group: 'Appearance', keywords: 'density size smaller bigger', run: () => update({ density: density === 'compact' ? 'comfortable' : 'compact' }) },
    { id: 'water', label: water ? 'Turn off the water cursor' : 'Turn on the water cursor', group: 'Appearance', keywords: 'ripple effect animation', run: () => update({ waterCursor: !water }) },
  ], [openModal, navigate, openHelp, accentNow, density, water, update])

  const appItems = useMemo<Command[]>(
    () => (apps ?? []).map((a) => ({ id: `app-${a.id}`, label: `${a.company} · ${a.role}`, group: 'Applications', hint: STATUS_LABELS[a.status], keywords: a.location ?? '', run: () => openModal({ kind: 'details', id: a.id }) })),
    [apps, openModal],
  )
  // Your applications only appear once you start typing, so the empty box shows a short, useful list of commands.
  const results = useMemo(() => rankItems(query, query.trim() ? [...commands, ...appItems] : commands, 10), [query, commands, appItems])
  const index = Math.min(active, Math.max(0, results.length - 1))

  useEffect(() => { (list.current?.children[index] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' }) }, [index, results])

  const run = (c: Command | undefined) => { if (!c) return; close(); c.run() }
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((index + 1) % Math.max(1, results.length)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((index - 1 + results.length) % Math.max(1, results.length)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[index]) }
  }

  return (
    <Modal open={open} onClose={close} title="Quick find">
      <div className="flex flex-col gap-3">
        <Input
          label="Type a command, or the name of a company" value={query} autoFocus autoComplete="off" placeholder="Try: calendar, add, violet, google..."
          onChange={(e) => { setQuery(e.target.value); setActive(0) }} onKeyDown={onKeyDown}
          role="combobox" aria-expanded aria-controls="palette-results" aria-activedescendant={results[index] ? `palette-${results[index].id}` : undefined}
        />
        {results.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Nothing matches &ldquo;{query}&rdquo;.</p>
        ) : (
          <ul id="palette-results" ref={list} role="listbox" aria-label="Results" className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
            {results.map((c, i) => (
              <li
                key={c.id} id={`palette-${c.id}`} role="option" aria-selected={i === index}
                onMouseEnter={() => setActive(i)} onClick={() => run(c)}
                className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-control px-3 py-2 text-sm', i === index ? 'bg-accent/15 text-ink' : 'text-muted')}
              >
                <span className="truncate">{c.label}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  {c.hint && <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono">{c.hint}</kbd>}
                  <span className="text-muted/70">{c.group}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">Up and down to choose, Enter to run, Esc to close.</p>
      </div>
    </Modal>
  )
}
