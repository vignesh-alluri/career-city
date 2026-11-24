import { cn } from '@/lib/utils'
import type { Signal } from '@/selectors/signals'

// Full class names written out, because Tailwind only creates the classes it can find as whole words in the source.
const LIT: Record<Signal, string> = {
  red: 'bg-signal-red shadow-[0_0_8px_var(--color-signal-red)] motion-safe:animate-pulse',
  amber: 'bg-amber shadow-[0_0_8px_var(--color-amber)]',
  green: 'bg-signal shadow-[0_0_8px_var(--color-signal)]',
}
const ORDER: Signal[] = ['red', 'amber', 'green']

export interface BoardRow {
  key: string
  /** The big left-hand column, like a departure time: "21 NOV" */
  when: string
  /** Small text under it: "in 3 days", "09:30" */
  whenNote?: string
  title: string
  detail?: string
  late?: boolean
  onSelect?: () => void
}

/** A station departure board: a dark panel, a monospaced "when" column and one row per thing coming up. */
export function DepartureBoard({ title, count, emptyText, rows, signal, signalLabel }: {
  title: string; count: string; emptyText: string; rows: BoardRow[]
  /** The railway signal in the corner: which light is on tells you at a glance whether anything needs you */
  signal: Signal; signalLabel: string
}) {
  return (
    <section aria-label={title} className="overflow-hidden rounded-panel border border-line bg-black/30 shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-3">
        <h2 className="eyebrow flex items-center gap-3 text-ink">
          <span role="img" aria-label={signalLabel} title={signalLabel} className="flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-1.5">
            {ORDER.map((light) => <span key={light} className={cn('size-2 rounded-full', signal === light ? LIT[light] : 'bg-white/10')} />)}
          </span>
          {title}
        </h2>
        <span className="font-mono text-[11px] text-muted">{count}</span>
      </header>

      {rows.length === 0 ? (
        <p className="px-5 py-6 font-mono text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-line/40">
          {rows.map((r) => {
            const body = (
              <>
                <span className="w-[5.25rem] shrink-0">
                  <span className={cn('block font-mono text-sm font-semibold uppercase tabular-nums', r.late ? 'text-danger' : 'text-amber')}>{r.when}</span>
                  {r.whenNote && <span className="block font-mono text-[11px] text-muted">{r.whenNote}</span>}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  {r.detail && <span className="block truncate text-xs text-muted">{r.detail}</span>}
                </span>
              </>
            )
            return (
              <li key={r.key}>
                {r.onSelect ? (
                  <button type="button" onClick={r.onSelect} className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-white/5">{body}</button>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-3">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
