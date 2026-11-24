import type { CSSProperties } from 'react'
import { TrainGlyph } from '@/components/ui/Train'
import { cn } from '@/lib/utils'
import type { Station } from '@/selectors/pipeline'

interface Fact { value: number; label: string }

/**
 * The whole pipeline as a metro line. Stations are the stages; the track glows as far as your furthest application has got.
 * The facts underneath replace what used to be seven separate number cards.
 */
export function PipelineLine({ stations, litIndex, facts }: { stations: Station[]; litIndex: number; facts: Fact[] }) {
  const litWidth = litIndex <= 0 ? 0 : (litIndex / (stations.length - 1)) * 80 // the track runs from 10% to 90% of the width

  return (
    <section aria-label="Your pipeline" className="rounded-panel border border-line bg-card/60 px-5 pb-4 pt-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="eyebrow text-ink">Your line</h2>
        <p className="text-xs text-muted">Where each application is right now</p>
      </div>

      <ol className="relative mt-7 grid grid-cols-5">
        <div aria-hidden className="absolute left-[10%] right-[10%] top-3 h-1 rounded-full bg-white/10" />
        <div
          aria-hidden
          className="absolute left-[10%] top-3 h-1 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)] transition-[width] duration-700"
          style={{ width: `${litWidth}%` }}
        />
        {/* the train drives from the first station to the furthest one that has an application, and waits there. Its front end stops
            at the station; the stations are drawn above it, so it passes behind them. A new `key` replays the run when that station changes. */}
        {litIndex >= 0 && (
          <span
            key={litIndex} aria-hidden className="train-run z-[5] -translate-x-full"
            style={{ top: 14 - 5, '--from': '10%', '--to': `${10 + litWidth}%` } as CSSProperties}
          ><TrainGlyph cars={3} /></span>
        )}
        {stations.map((s, i) => {
          const active = s.count > 0
          const passed = !active && i < litIndex
          const isOffer = s.id === 'offer'
          return (
            <li key={s.id} className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span
                aria-hidden
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border-[3px] bg-void font-mono text-[10px] tabular-nums',
                  active && !isOffer && 'border-accent text-ink shadow-[0_0_14px_var(--color-accent)]',
                  active && isOffer && 'border-success text-ink shadow-[0_0_14px_var(--color-success)]',
                  passed && 'border-accent/60 text-muted',
                  !active && !passed && 'border-white/20 text-muted/70',
                )}
              >{String(i + 1).padStart(2, '0')}</span>
              <span className={cn('font-display text-3xl font-semibold leading-none tabular-nums', active ? (isOffer ? 'text-success' : 'text-ink') : 'text-muted/50')}>{s.count}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </li>
          )
        })}
      </ol>

      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t border-line/60 pt-3 text-sm text-muted">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline gap-1.5">
            <dt className="sr-only">{f.label}</dt>
            <dd className="font-display font-semibold tabular-nums text-ink">{f.value}</dd>
            <span aria-hidden>{f.label}</span>
          </div>
        ))}
      </dl>
    </section>
  )
}
