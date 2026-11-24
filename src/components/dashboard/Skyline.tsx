import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { TrainGlyph } from '@/components/ui/Train'
import { cn } from '@/lib/utils'
import { skylineBuildings } from '@/selectors/pipeline'
import { STATUS_LABELS, type Application } from '@/types'

/**
 * Your applications as a skyline: one building per application, taller the further along it has got.
 * It is drawn from your real data, the same idea as the 3D "My city" page, just flat.
 */
export function Skyline({ apps, onOpen }: { apps: Application[]; onOpen: (id: string) => void }) {
  const { buildings, hidden } = skylineBuildings(apps)
  return (
    <section aria-label="Your skyline" className="rounded-panel border border-line bg-card/60 p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="eyebrow text-ink">Your skyline</h2>
          <p className="text-xs text-muted">One building per application. Taller means further along; dark lots are rejections.</p>
        </div>
        <Link to="/app/city" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">Explore My city <ArrowRight size={14} aria-hidden /></Link>
      </div>

      <div className="relative mt-5">
      <div className="overflow-x-auto pb-1">
        <ul className="flex h-36 min-w-max items-end gap-1.5 border-b border-line px-1">
          {buildings.map((b, i) => {
            const rejected = b.level === 0
            const offer = b.level === 5
            return (
              <li key={b.id} className="h-full">
                <button
                  type="button" onClick={() => onOpen(b.id)}
                  aria-label={`${b.company}, ${b.role}: ${STATUS_LABELS[b.status]}`} title={`${b.company}: ${STATUS_LABELS[b.status]}`}
                  className={cn(
                    'relative flex h-full w-6 items-end transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5',
                  )}
                >
                  <span
                    className={cn(
                      'build relative block w-full overflow-hidden rounded-t-[3px] border border-b-0',
                      rejected ? 'border-white/10 bg-white/[0.04]' : 'border-line bg-gradient-to-t from-surface to-card',
                      offer && 'border-success/60 shadow-[0_0_16px_-2px_var(--color-success)]',
                    )}
                    style={{ height: rejected ? '14%' : `${16 + b.level * 16}%`, '--d': `${Math.min(i, 30) * 30}ms` } as CSSProperties}
                  >
                    {!rejected && (
                      <span
                        aria-hidden
                        className={cn('absolute inset-x-[3px] inset-y-1.5 opacity-70', offer ? 'text-success' : 'text-ember')}
                        style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1.6px)', backgroundSize: '5px 7px' }}
                      />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      {/* a train crosses the ground line now and then (22 seconds a lap, mostly resting off-screen) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[7px] h-3 overflow-hidden"><span className="train-pass bottom-0"><TrainGlyph cars={5} /></span></div>
      </div>
      {hidden > 0 && <p className="mt-2 text-xs text-muted">Showing the {buildings.length} furthest along. {hidden} more are not drawn.</p>}
    </section>
  )
}
